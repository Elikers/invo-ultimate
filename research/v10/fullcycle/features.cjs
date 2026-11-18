'use strict';
// Stages 1-3: captured, time-bounded public data -> explicit source-observed features.
// Never use receipt-only funding/OI as exchange-timestamped features.
const crypto=require('node:crypto'),P=require('../data/provenance.cjs');
const sha=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const BOUNDS={trend:5,volatility:5,volume_ratio:10,spread_bps:100,order_imbalance:1,funding:.01,open_interest_change:5};
const REGIONS=['BTC','ETH','SOL'];
function observe(events,market,now,contexts=[]){
 if(!REGIONS.includes(market)||!Number.isSafeInteger(now))throw Error('Invalid market/clock');
 if(!Array.isArray(events)||!Array.isArray(contexts))throw Error('Validated market events/contexts required');
 const valid=events.filter(e=>e.schema==='invo-v10-data-event-1'&&
  e.market===market&&e.quality?.valid===true&&e.quality.market_data_gap===false&&
  e.use?.training_eligible===false&&e.use?.live_orders_allowed===false&&
  Number.isSafeInteger(e.timestamps.available_to_model_ms)&&
  e.timestamps.available_to_model_ms<=now&&
  e.timestamps.source_event_ms<=now+2000);
 const books=valid.filter(e=>e.kind==='BOOK_SNAPSHOT').sort((a,b)=>a.timestamps.available_to_model_ms-b.timestamps.available_to_model_ms);
 const trades=valid.filter(e=>e.kind==='PUBLIC_TRADE').sort((a,b)=>a.timestamps.available_to_model_ms-b.timestamps.available_to_model_ms);
 const b=books.at(-1);
 const observed=[],values={},reasons=[];
 const put=(key,v,ts,maxAge=3000)=>{
  if(!Number.isFinite(v)||Math.abs(v)>BOUNDS[key]||
   now-ts>maxAge||ts>now){reasons.push('INVALID_OR_STALE_'+key);return}
  observed.push(key);values[key]=v;
 };
 if(b){
  const p=b.payload;
  put('spread_bps',p.spread_bps,b.timestamps.available_to_model_ms);
  if(Array.isArray(p.bids)&&Array.isArray(p.asks)){
   const buys=p.bids.slice(0,10).reduce((s,x)=>s+x.sz,0),
    sells=p.asks.slice(0,10).reduce((s,x)=>s+x.sz,0);
   if(buys+sells>0)put('order_imbalance',(buys-sells)/(buys+sells),b.timestamps.available_to_model_ms);
  }
 }else reasons.push('NO_BOOK_SNAPSHOT');
 // Trade-price features require >=26 source events actually observed during the window.
 const t=trades.filter(x=>now-x.timestamps.available_to_model_ms<=120000);
 if(t.length>=26){
  const ps=t.slice(-26).map(x=>x.payload.price);
  const trend=100*(ps.at(-1)/ps[0]-1);
  const vol=Math.sqrt(ps.slice(1).reduce((s,p,i)=>s+(100*(p/ps[i]-1))**2,0)/25);
  put('trend',trend,t.at(-1).timestamps.available_to_model_ms);
  put('volatility',vol,t.at(-1).timestamps.available_to_model_ms);
  // Volume ratio requires a previously registered comparable time bucket; do not invent it.
 }else reasons.push('INSUFFICIENT_TIMESTAMPED_TRADE_HISTORY');
 const bucketMs=30000,lastBucket=Math.floor(now/bucketMs)-1;
 const bucketVolumes=[lastBucket-3,lastBucket-2,lastBucket-1,lastBucket].map(k=>
  trades.filter(x=>Math.floor(x.timestamps.available_to_model_ms/bucketMs)===k)
   .reduce((s,x)=>s+x.payload.size,0));
 if(bucketVolumes.every(v=>Number.isFinite(v)&&v>0)){
  const prevAvg=(bucketVolumes[0]+bucketVolumes[1]+bucketVolumes[2])/3;
  const ratio=bucketVolumes[3]/prevAvg;
  put('volume_ratio',Math.min(10,ratio),lastBucket*bucketMs,120000);
  if(ratio>10)reasons.push('VOLUME_RATIO_SATURATED_AT_BOUND');
 }else reasons.push('INSUFFICIENT_FOUR_COMPLETED_VOLUME_BUCKETS');
 const validContext=contexts.filter(x=>x?.schema==='invo-v10-receipt-only-context-1'&&
  x.market===market&&x.source_event_ms===null&&x.training_eligible===false&&
  x.live_orders_allowed===false&&x.source_time_provenance==='RECEIPT_ONLY_NO_EXCHANGE_EVENT_TIMESTAMP'&&
  Number.isSafeInteger(x.received_wall_ms)&&x.received_wall_ms<=now&&
  now-x.received_wall_ms<=300000).sort((a,b)=>a.received_wall_ms-b.received_wall_ms);
 const latest=validContext.at(-1);
 if(latest){
  put('funding',latest.payload.funding_rate_fraction,latest.received_wall_ms,60000);
  const old=validContext.slice(0,-1).reverse().find(x=>latest.received_wall_ms-x.received_wall_ms>=10000&&
   latest.received_wall_ms-x.received_wall_ms<=300000&&x.payload.open_interest>0);
  if(old&&latest.payload.open_interest>0)
   put('open_interest_change',100*(latest.payload.open_interest/old.payload.open_interest-1),latest.received_wall_ms,60000);
  else reasons.push('OPEN_INTEREST_TWO_RECEIPTS_NOT_AVAILABLE');
  reasons.push('DERIVATIVES_CONTEXT_RECEIPT_ONLY_NOT_EXCHANGE_EVENT_TIME');
 }else{
  reasons.push('FUNDING_CONTEXT_MISSING_OR_STALE');
  reasons.push('OPEN_INTEREST_CONTEXT_MISSING_OR_STALE');
 }
 const snapshot={market,at_ms:now,features:{observed,values},
  entry_reference_quote:b?{bid:b.payload.best_bid,ask:b.payload.best_ask,
   source_received_ms:b.timestamps.available_to_model_ms,
   source_sha256:b.source.raw_sha256}:null,
  input_event_hashes:valid.slice(-256).map(x=>x.source.raw_sha256),
  receipt_only_context_hashes:validContext.slice(-20).map(x=>x.raw_sha256),
  provenance:'OBSERVED_PUBLIC_ONLY_NOT_EXECUTABLE',full_feature_set:observed.length===7,
  live_orders_allowed:false,reasons};
 return {...snapshot,sha256:sha(snapshot)};
}
function fromJournal(events,market,now,contexts=[]){
 // Caller must explicitly have verified raw/checksum and sequence replay; do not claim it here.
 return observe(events,market,now,contexts);
}
module.exports={observe,fromJournal,sha};
