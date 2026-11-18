'use strict';
// v8.5 research-only completed candle resampling. NOT a new strategy or trade backtest.
const FIVE=300000,PERIODS=Object.freeze({'15m':3,'1h':12,'4h':48});
function aggregate(bars,period){
 const step=PERIODS[period];if(!step||!Array.isArray(bars))throw Error('Unsupported timeframe or history');
 const ret=[],bucketMs=step*FIVE;let bucket=[];
 for(let i=0;i<bars.length;i++){
  const x=bars[i];if(!x||![x.t,x.o,x.h,x.l,x.c,x.v].every(Number.isFinite)||
   !Number.isSafeInteger(x.t)||x.t%FIVE!==0||x.o<=0||x.l<=0||x.h<x.l||
   x.h<Math.max(x.o,x.c)||x.l>Math.min(x.o,x.c)||x.v<0||
   (i>0&&x.t-bars[i-1].t!==FIVE))throw Error('Invalid source candles');
  const target=Math.floor(x.t/bucketMs)*bucketMs;
  if(bucket.length&&Math.floor(bucket[0].t/bucketMs)*bucketMs!==target)bucket=[];
  if(x.t===target)bucket=[x];
  else if(bucket.length)bucket.push(x);
  if(bucket.length===step){
   ret.push({t:target,o:bucket[0].o,c:bucket.at(-1).c,
     h:Math.max(...bucket.map(v=>v.h)),l:Math.min(...bucket.map(v=>v.l)),
     v:bucket.reduce((s,v)=>s+v.v,0),closed_at:target+bucketMs,
     source_candles:step});
   bucket=[];
  }
 }
 return {schema:'invo-v8.5-closed-timeframe-1',period,rows:ret,
    status:'DATA_ONLY_NO_SIGNAL_NO_TRADE',warning:'Only completed, contiguous 5m candles; the last incomplete higher timeframe is discarded.'};
}
module.exports={PERIODS,aggregate};
