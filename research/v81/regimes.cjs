/* INVO v8.1 — strictly past-closed-candle regime labels.
 * DESCRIPTIVE ONLY: never gates, changes, or backfills production signals.
 * The signal index is a COMPLETED candle, never the forming candle.
 */
'use strict';
const HISTORY=24,MINUTES=5;
function labelAt(bars,endIndex){
 if(!Array.isArray(bars)||!Number.isInteger(endIndex)||endIndex<24||endIndex>=bars.length)return null;
 const from=endIndex-HISTORY;
 for(let i=from;i<=endIndex;i++){
  const x=bars[i];
  if(!x||![x.t,x.o,x.h,x.l,x.c].every(Number.isFinite)||x.c<=0||x.o<=0||x.l<=0||
       x.h<x.l||x.h<Math.max(x.o,x.c)||x.l>Math.min(x.o,x.c)||
       (i>from && x.t-bars[i-1].t!==MINUTES*60000))throw Error('Invalid completed 5m history');
 }
 const oldest=bars[from],latest=bars[endIndex];
 const trendPct=(latest.c/oldest.c-1)*100;
 const ranges=bars.slice(endIndex-23,endIndex+1);
 const avgRangePct=ranges.reduce((sum,x)=>sum+100*(x.h-x.l)/x.c,0)/ranges.length;
 const direction=trendPct>=1?'UP':trendPct<=-1?'DOWN':'SIDEWAYS';
 const volatility=avgRangePct>=.55?'HIGH':avgRangePct<=.18?'LOW':'NORMAL';
 return {based_on_completed_bar_t:latest.t,trend_2h_pct:trendPct,
  recent_mean_5m_range_pct:avgRangePct,trend:direction,volatility,
  rule_id:'FROZEN_V66_EXISTING_THRESHOLDS_DESCRIPTIVE_ONLY'};
}
function classifyPriorToEntry(bars,signalIndex){
 // Entry in original simulator is signalIndex+1. Only information through signalIndex may be used.
 return labelAt(bars,signalIndex);
}
module.exports={HISTORY,labelAt,classifyPriorToEntry};
