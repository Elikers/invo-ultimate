'use strict';
// Research-only strict feed adapters; no sockets, execution endpoints or secrets.
const P=require('./provenance.cjs');
const fail=x=>{throw Error(x)};
const price=x=>{const n=Number(x);if(!Number.isFinite(n)||n<=0)fail('Invalid positive price');return n};
const qty=x=>{const n=Number(x);if(!Number.isFinite(n)||n<0)fail('Invalid nonnegative quantity');return n};
function book(raw){
 if(raw?.channel!=='l2Book'||typeof raw.data?.coin!=='string'||!Number.isSafeInteger(raw.data.time))
 fail('Unexpected l2Book frame');
 const levels=raw.data.levels;if(!Array.isArray(levels)||levels.length!==2)fail('Book levels missing');
 const side=arr=>{if(!Array.isArray(arr)||arr.length===0||arr.length>50)fail('Invalid book depth');
 return arr.map(x=>({px:price(x.px),sz:qty(x.sz)}))};
 const bids=side(levels[0]),asks=side(levels[1]);
 if(bids.some((b,i)=>i&&b.px>=bids[i-1].px)||
 asks.some((a,i)=>i&&a.px<=asks[i-1].px)||
 bids[0].px>=asks[0].px)fail('Crossed or unsorted book');
 return {kind:'BOOK_SNAPSHOT',coin:raw.data.coin,sourceEventMs:raw.data.time,
 payload:{bids,asks,best_bid:bids[0].px,best_ask:asks[0].px,
 spread_bps:1e4*(asks[0].px-bids[0].px)/((asks[0].px+bids[0].px)/2)}};
}
function trades(raw){
 if(raw?.channel!=='trades'||!Array.isArray(raw.data)||raw.data.length===0||
 raw.data.length>1000)fail('Invalid public trade batch');
 return raw.data.map(x=>{
 if(typeof x.coin!=='string'||!Number.isSafeInteger(x.time)||x.time<=0||
 !['B','A'].includes(x.side)||(!Number.isSafeInteger(x.tid)&&typeof x.tid!=='string'))
 fail('Invalid trade fields');
 return {kind:'PUBLIC_TRADE',coin:x.coin,sourceEventMs:x.time,sourceMessageId:String(x.tid),
  payload:{price:price(x.px),size:qty(x.sz),aggressor_side:x.side}};
 });
}
function context(raw,receivedWallMs){
 if(raw?.channel!=='activeAssetCtx'||typeof raw.data?.coin!=='string'||!raw.data.ctx)
 fail('Invalid asset context');
 const c=raw.data.ctx,mark=price(c.markPx),oracle=price(c.oraclePx);
 const oi=qty(c.openInterest),funding=Number(c.funding);
 if(!Number.isFinite(funding)||Math.abs(funding)>1)fail('Invalid funding decimal fraction');
 if(!Number.isSafeInteger(receivedWallMs)||receivedWallMs<=0)fail('Invalid receipt time');
 return {kind:'DERIVATIVES_CONTEXT',coin:raw.data.coin,sourceEventMs:null,
   sourceTimeProvenance:'RECEIPT_ONLY_NO_EXCHANGE_EVENT_TIMESTAMP',
   payload:{mark_price:mark,oracle_price:oracle,open_interest:oi,
    funding_rate_fraction:funding,source_event_time_known:false}};
}
function requiredTimestamp(adapterResult){
 if(adapterResult.sourceEventMs===null)throw Error('No source timestamp: use separate receipt-only schema; never invent exchange event time');
 return adapterResult.sourceEventMs;
}
module.exports={book,trades,context,requiredTimestamp};
