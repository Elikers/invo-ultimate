'use strict';
// v10 Phase A — feed-specific offline adapters, no network, orders or credentials.
const {stableHash}=require('../data/provenance.cjs');
const finitePositive=x=>Number.isFinite(Number(x))&&Number(x)>0;
function instrument(coin){if(typeof coin!=='string'||!/^[A-Z0-9]{2,15}$/.test(coin))throw Error('INVALID_SYMBOL');return coin;}
function hyperliquidL2(message){
 if(message?.channel!=='l2Book'||!message?.data)throw Error('WRONG_FEED');
 const d=message.data,coin=instrument(d.coin);
 if(!Number.isSafeInteger(d.time)||d.time<=0||!Array.isArray(d.levels)||d.levels.length!==2)
 throw Error('MISSING_SOURCE_TIME_OR_LEVELS');
 const side=(rows,which)=>{
  if(!Array.isArray(rows)||rows.length===0||rows.length>100)throw Error('INVALID_DEPTH');
  return rows.map((r,i)=>{const p=Number(r.px),sz=Number(r.sz);
   if(!finitePositive(p)||!finitePositive(sz))throw Error('INVALID_PRICE_OR_SIZE');
   if(i>0&&!(which==='bid'?p<Number(rows[i-1].px):p>Number(rows[i-1].px)))
    throw Error('UNSORTED_OR_DUPLICATE_LEVELS');
   return {price:p,size:sz,count:Number.isInteger(r.n)?r.n:null};
  });
 };
 const bids=side(d.levels[0],'bid'),asks=side(d.levels[1],'ask');
 if(bids[0].price>=asks[0].price)throw Error('CROSSED_BOOK');
 const spreadBps=1e4*(asks[0].price-bids[0].price)/((asks[0].price+bids[0].price)/2);
 return Object.freeze({kind:'BOOK_SNAPSHOT',venue:'hyperliquid',venueSymbol:coin,
  eventTimeMs:d.time,payload:{bids,asks,bestBid:bids[0].price,bestAsk:asks[0].price,
  spreadBps,imbalance:(bids[0].size-asks[0].size)/(bids[0].size+asks[0].size)},
  messageId:stableHash(JSON.stringify(d)),sourceTimeVerified:true});
}
function hyperliquidTrades(message){
 if(message?.channel!=='trades'||!Array.isArray(message.data))throw Error('WRONG_FEED');
 return message.data.map(t=>{
  const coin=instrument(t.coin),price=Number(t.px),size=Number(t.sz);
  if(!finitePositive(price)||!finitePositive(size)||!Number.isSafeInteger(t.time)||t.time<=0||
   !['B','A'].includes(t.side)||typeof t.tid!=='number'&&!/^[0-9a-f]+$/i.test(String(t.tid||'')))
   throw Error('INVALID_PUBLIC_TRADE');
  return {kind:'PUBLIC_TRADE',venue:'hyperliquid',venueSymbol:coin,eventTimeMs:t.time,
   messageId:coin+':'+String(t.tid),payload:{price,size,aggressorSide:t.side},sourceTimeVerified:true};
 });
}
function hyperliquidContext(message,receivedWallMs){
 if(message?.channel!=='activeAssetCtx'||!message.data)throw Error('WRONG_FEED');
 const d=message.data,coin=instrument(d.coin),ctx=d.ctx||d;
 const mark=Number(ctx.markPx),oracle=Number(ctx.oraclePx),oi=Number(ctx.openInterest),funding=Number(ctx.funding);
 if(!finitePositive(mark)||!finitePositive(oracle)||!Number.isFinite(oi)||oi<0||
 !Number.isFinite(funding)||!Number.isSafeInteger(receivedWallMs))throw Error('INVALID_DERIVATIVE_CONTEXT');
 // activeAssetCtx often has no native source-event timestamp: never invent one.
 return {kind:'DERIVATIVES_CONTEXT',venue:'hyperliquid',venueSymbol:coin,
  eventTimeMs:null,observedAtMs:receivedWallMs,sourceTimeVerified:false,
  messageId:stableHash(JSON.stringify(message.data)),payload:{markPrice:mark,oraclePrice:oracle,
   openInterest:oi,fundingRate:funding,fundingRateUnit:'venue_reported_rate_not_payment'}};
}
module.exports={hyperliquidL2,hyperliquidTrades,hyperliquidContext};
