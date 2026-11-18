'use strict';
const {aggregate}=require('../v85/timeframes.cjs');
const PLAN=require('./registration.json');
function candidate(bars,id,observedAt){
 const spec=PLAN.candidates.find(x=>x.id===id);
 if(!spec||!Number.isFinite(observedAt)||observedAt<=Date.parse(PLAN.not_before_utc))
  throw Error('Candidate not preregistered or forward period not started');
 const rows=aggregate(bars,spec.timeframe).rows;
 if(rows.length<spec.lookback_completed_bars+1)return {side:'NONE',reason:'INSUFFICIENT_HISTORY'};
 const latest=rows.at(-1),first=rows.at(-1-spec.lookback_completed_bars);
 if(latest.closed_at>observedAt)throw Error('Future higher-timeframe candle / lookahead');
 const pct=100*(latest.c/first.c-1);
 return {id,side:pct>=spec.threshold_abs_pct?'LONG':pct<=-spec.threshold_abs_pct?'SHORT':'NONE',
   signal_closed_at:latest.closed_at,observed_at:observedAt,lookback_change_pct:pct,
   scope:'RESEARCH_SIGNAL_ONLY_NOT_TRADE',baseline_unchanged:true};
}
module.exports={candidate};
