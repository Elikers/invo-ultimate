'use strict';
// Stages 1-3: captured, time-bounded public data -> explicit source-observed features.
// Never use receipt-only funding/OI as exchange-timestamped features.
const crypto=require('node:crypto'),P=require('../data/provenance.cjs');
const sha=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const BOUNDS={trend:5,volatility:5,volume_ratio:10,spread_bps:100,order_imbalance:1,funding:.01,open_interest_change:5};
const REGIONS=['BTC','ETH','SOL'];
function observe(events,market,now){
 if(!REGIONS.includes(market)||!Number.isSafeInteger(now))throw Error('Invalid market/clock');
 if(!Array.isArray(events))throw Error('Validated market events required');
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
 const put=(key,v,ts)=>{
  if(!Number.isFinite(v)||Math.abs(v)>BOUNDS[key]||
   now-ts>3000||ts>now){reasons.push('INVALID_OR_STALE_'+key);return}
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
 reasons.push('VOLUME_RATIO_NEEDS_REGISTERED_BUCKETS');
 reasons.push('FUNDING_REQUIRES_EXCHANGE_TIMED_SOURCE');
 reasons.push('OPEN_INTEREST_REQUIRES_EXCHANGE_TIMED_SOURCE');
 const snapshot={market,at_ms:now,features:{observed,values},
  entry_reference_quote:b?{bid:b.payload.best_bid,ask:b.payload.best_ask,
   source_received_ms:b.timestamps.available_to_model_ms,
   source_sha256:b.source.raw_sha256}:null,
  input_event_hashes:valid.slice(-256).map(x=>x.source.raw_sha256),
  provenance:'OBSERVED_PUBLIC_ONLY_NOT_EXECUTABLE',full_feature_set:observed.length===7,
  live_orders_allowed:false,reasons};
 return {...snapshot,sha256:sha(snapshot)};
}
function fromJournal(events,market,now){
 // Caller must explicitly have verified raw/checksum and sequence replay; do not claim it here.
 return observe(events,market,now);
}
module.exports={observe,fromJournal,sha};
