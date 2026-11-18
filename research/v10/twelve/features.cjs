'use strict';
// Research only. A pure market feature builder: only data with verifiable availability is eligible.
// No interpolation of absent spread / order imbalance / funding / open interest.
const REG=require('../learners/registration.json');
const required=REG.feature_names;
const valid=(x)=>typeof x==='number'&&Number.isFinite(x);
function build({market,decisionTimeMs,bars,book,context,previousContext}){
 if(!['BTC','ETH','SOL'].includes(market)||!Number.isSafeInteger(decisionTimeMs))
 throw Error('Invalid prediction time / instrument');
 const values={},observed=[],sources={};
 function put(name,value,source){
  if(!valid(value)||Math.abs(value)>REG.feature_bounds[name])throw Error('Invalid source feature: '+name);
  values[name]=value;observed.push(name);sources[name]=source;
 }
 if(Array.isArray(bars)&&bars.length>=25){
  const last=bars.at(-1),prev=bars.at(-25);
  if(bars.some(x=>!Number.isSafeInteger(x.close_available_ms)||x.close_available_ms>decisionTimeMs||
   !valid(x.high)||!valid(x.low)||!valid(x.close)||!valid(x.volume)||x.close<=0||x.volume<0||
   x.high<x.low||x.high<x.close||x.low>x.close))throw Error('Future or malformed completed bar');
  const window=bars.slice(-20),vbase=bars.slice(-21,-1).reduce((s,x)=>s+x.volume,0)/20;
  put('trend',Math.max(-5,Math.min(5,100*(last.close/prev.close-1))),'completed_ohlcv');
  put('volatility',Math.min(5,window.reduce((s,x)=>s+100*(x.high-x.low)/x.close,0)/20),'completed_ohlcv');
  if(vbase>0)put('volume_ratio',Math.min(10,last.volume/vbase),'completed_ohlcv');
 }
 if(book){
  if(book.market!==market||!Number.isSafeInteger(book.available_ms)||book.available_ms>decisionTimeMs||
   decisionTimeMs-book.available_ms>3000||!book.verified||!book.snapshot)throw Error('Untrusted book snapshot');
  const bids=book.bids,asks=book.asks;
  if(!Array.isArray(bids)||!Array.isArray(asks)||!bids.length||!asks.length||
   bids.some(x=>!valid(x.px)||!valid(x.sz)||x.px<=0||x.sz<0)||
   asks.some(x=>!valid(x.px)||!valid(x.sz)||x.px<=0||x.sz<0)||
   bids[0].px>=asks[0].px)throw Error('Crossed or invalid book');
  const mid=(bids[0].px+asks[0].px)/2,bs=bids.reduce((s,x)=>s+x.sz,0),
   as=asks.reduce((s,x)=>s+x.sz,0);
  put('spread_bps',1e4*(asks[0].px-bids[0].px)/mid,'exchange_book_snapshot');
  if(bs+as>0)put('order_imbalance',(bs-as)/(bs+as),'exchange_book_snapshot');
 }
 if(context){
  if(context.market!==market||!Number.isSafeInteger(context.available_ms)||
   context.available_ms>decisionTimeMs||decisionTimeMs-context.available_ms>60000||
   !context.receipt_only||!context.verified)throw Error('Untrusted context receipt');
  if(valid(context.funding))put('funding',context.funding,'receipt_only_not_exchange_event_timestamp');
  if(previousContext){
   if(previousContext.market!==market||!previousContext.verified||
    !Number.isSafeInteger(previousContext.available_ms)||
    previousContext.available_ms>=context.available_ms||previousContext.available_ms>decisionTimeMs||
    !valid(previousContext.oi)||!valid(context.oi)||previousContext.oi<=0||context.oi<0)
    throw Error('Untrusted OI history');
   put('open_interest_change',Math.max(-5,Math.min(5,(context.oi/previousContext.oi-1)*100)),
    'two_receipt_only_context_samples');
  }
 }
 return {schema:'invo-v10-feature-snapshot-2',market,decisionTimeMs,values,
  observed:required.filter(x=>observed.includes(x)),missing:required.filter(x=>!observed.includes(x)),
  sources,training_eligible:false,live_orders_allowed:false};
}
module.exports={build};
