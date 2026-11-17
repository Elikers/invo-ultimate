/* INVO v6.5 — diagnostics on historical closed paper trades only. No risk parameter changes. */
'use strict';
function finite(x){return typeof x==='number'&&Number.isFinite(x)}
function streaks(trades,costBps=8){
 let loss=0,maxLoss=0,win=0,maxWin=0,underwater=0,maxUnderwater=0,eq=1,high=1,peakIndex=-1,maxRecoveryBars=0,drawdown=0,ddPeak=-1,ddTrough=-1;
 for(let i=0;i<trades.length;i++){
  const p=trades[i].grossPct-costBps/100;
  if(p<0){loss++;win=0;}else if(p>0){win++;loss=0;}else{loss=0;win=0;}
  maxLoss=Math.max(maxLoss,loss);maxWin=Math.max(maxWin,win);
  eq*=Math.max(0,1+p/100);
  if(eq>high){high=eq;peakIndex=i;underwater=0;}
  else {underwater++;maxUnderwater=Math.max(maxUnderwater,underwater);}
  const d=high?100*(high-eq)/high:100;
  if(d>drawdown){drawdown=d;ddPeak=peakIndex;ddTrough=i;}
 }
 return {trades:trades.length,max_consecutive_losses:maxLoss,max_consecutive_wins:maxWin,max_unrecovered_trade_streak:maxUnderwater,max_drawdown_pct:trades.length?drawdown:null,worst_drawdown_peak_trade_index:ddPeak,worst_drawdown_trough_trade_index:ddTrough,assumed_round_trip_cost_bps:costBps};
}
function grade(x){
 if(!x||x.closed_trades<60||x.period?.[1]?.count<20||x.period?.[2]?.count<20)return {status:'INSUFFICIENT_SAMPLES',reasons:['Needs >=60 historical trades, >=20 middle-period trades and >=20 last-period trades']};
 const mid=x.period[1],last=x.period[2],cost8=x.stress_bps?.['8'],cost16=x.stress_bps?.['16'];
 const reasons=[];
 if(!(mid.expectancyPct>0&&last.expectancyPct>0&&mid.profitFactor>1.1&&last.profitFactor>1.1))reasons.push('Middle/last chronological periods fail the positive net edge screen at 8 bps');
 if(!(cost8?.expectancyPct>0&&cost16?.expectancyPct>0))reasons.push('Full-window average is not positive at both 8 and 16 bps');
 if(!(cost16?.profitFactor>1.1))reasons.push('Full-window 16 bps profit factor is not above 1.1');
 if(!(cost16?.maxDrawdownPct<20))reasons.push('Full-window 16 bps drawdown is not below 20%');
 return {status:reasons.length?'HISTORICAL_ROBUSTNESS_SCREEN_FAILED':'PRELIMINARY_HISTORICAL_SCREEN_ONLY',reasons:reasons.length?reasons:['Passes exploratory historical screens, NOT independently forward-validated']};
}
function build(diagnosis,forward,health){
 if(diagnosis?.schema!=='invo-v6.4-loss-diagnosis-1')throw Error('Loss report missing or wrong schema');
 const markets={};
 for(const [coin,m]of Object.entries(diagnosis.markets||{})){
  if(m.status!=='ANALYZED'){markets[coin]={status:'UNAVAILABLE',reason:m.reason||'Historical data missing'};continue;}
  const strategies={};
  for(const [id,x]of Object.entries(m.strategies||{}))strategies[id]={grade:grade(x),risk:x.risk_8bps||null,closed_trades:x.closed_trades,net_8bps:x.stress_bps?.['8']?.expectancyPct??null,net_16bps:x.stress_bps?.['16']?.expectancyPct??null};
  markets[coin]={status:'ANALYZED',strategies};
 }
 const hasHeartbeat=health?.schema==='invo-v6.3-collector-health-1';
 const heartbeatTime=hasHeartbeat?Date.parse(health.observed_utc):NaN;
 const diagnosticTime=Date.parse(diagnosis.created_utc);
 const forwardTime=Date.parse(forward?.created_utc||'');
 const now=Date.now();
 const flags=[];
 if(hasHeartbeat&&health.action_event!=='schedule')flags.push('LAST_COLLECTOR_CHECK_NOT_SCHEDULE_TRIGGER');
 if(!hasHeartbeat)flags.push('COLLECTOR_HEARTBEAT_MISSING');
 else if(!Number.isFinite(heartbeatTime)||now-heartbeatTime>45*60000)flags.push('COLLECTOR_HEARTBEAT_STALE');
 if(!Number.isFinite(diagnosticTime)||now-diagnosticTime>36*3600000)flags.push('HISTORICAL_DIAGNOSIS_STALE');
 if(!forward||!Number.isFinite(forwardTime)||now-forwardTime>45*60000)flags.push('FORWARD_SUMMARY_STALE_OR_MISSING');
 if(Object.values(forward?.markets||{}).reduce((s,m)=>s+(m.closed||0),0)<60)flags.push('FORWARD_SAMPLE_INSUFFICIENT');
 return {schema:'invo-v6.5-integrity-risk-1',created_utc:new Date(now).toISOString(),historical_diagnosis_utc:diagnosis.created_utc,forward_summary_utc:forward?.created_utc||null,collector_heartbeat_utc:hasHeartbeat?health.observed_utc:null,collector_trigger:hasHeartbeat?(health.action_event||'UNKNOWN_LEGACY'):null,flags,markets,warnings:['Historical robustness screen is exploratory, not independent evidence of live profits.','Risk statistics use sequential non-overlapping trades separately for each strategy, not combined-portfolio or leverage-adjusted drawdown.','No live fills, funding, liquidation, spread, adaptive slippage or changing fees are modeled.']};
}
module.exports={streaks,grade,build};
