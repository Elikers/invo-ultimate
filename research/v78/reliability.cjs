/* INVO v7.8: Independent, read-only collector schedule and freshness evidence audit.
 * This module never dispatches workflows, changes production, reconstructs missed candles, or places orders.
 */
'use strict';
const HOUR=3600000,MIN=60000;
function assess(runs,health,now=Date.now(),opts={}){
 if(!Array.isArray(runs)||!Number.isFinite(now))throw Error('Invalid run list/time');
 const staleMinutes=opts.stale_minutes??45,windowHours=opts.window_hours??6;
 if(!Number.isFinite(staleMinutes)||staleMinutes<=0||!Number.isFinite(windowHours)||windowHours<=0)throw Error('Invalid bounds');
 const relevant=runs.filter(x=>x&&x.name==='INVO Automated Paper Research'&&Number.isFinite(Date.parse(x.created_at)))
 .sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));
 const eligible=x=>{const t=Date.parse(x.created_at);return t<=now&&t>=now-windowHours*HOUR;};
 const recent=relevant.filter(eligible);
 const schedule=recent.filter(x=>x.event==='schedule');
 const successes=recent.filter(x=>x.status==='completed'&&x.conclusion==='success');
 const scheduledSuccess=schedule.filter(x=>x.status==='completed'&&x.conclusion==='success');
 const latestSuccess=successes[0]||null,latestScheduledSuccess=scheduledSuccess[0]||null;
 const pending=recent.some(x=>['queued','in_progress','pending','waiting','requested'].includes(x.status));
 const heartbeatT=Date.parse(health?.observed_utc||'');
 const heartbeatValid=Number.isFinite(heartbeatT)&&heartbeatT<=now;
 const hbAge=heartbeatValid?Math.round((now-heartbeatT)/MIN*10)/10:null;
 const lastAge=latestSuccess?Math.round((now-Date.parse(latestSuccess.created_at))/MIN*10)/10:null;
 const scheduledT=scheduledSuccess.map(x=>Date.parse(x.created_at)).sort((a,b)=>a-b);
 const observedGaps=scheduledT.slice(1).map((t,i)=>Math.round((t-scheduledT[i])/MIN*10)/10);
 const markets=['BTC','ETH','SOL','JUP'].map(m=>{
   const r=health?.results?.[m];
   const valid=r?.status==='OK'&&Number.isFinite(r?.last_processed_completed_candle_t)&&
     Number.isFinite(health.expected_completed_candle_t)&&
     r.last_processed_completed_candle_t===health.expected_completed_candle_t;
   return {market:m,healthy_at_last_observation:!!valid};
 });
 const flags=[];
 if(!heartbeatValid)flags.push('HEARTBEAT_MISSING_OR_BAD_TIMESTAMP');
 else if(hbAge>staleMinutes)flags.push('HEARTBEAT_STALE');
 if(!latestSuccess)flags.push('NO_RECENT_SUCCESSFUL_RESEARCH_RUN');
 else if(lastAge>staleMinutes)flags.push('RESEARCH_RUN_STALE');
 if(markets.some(m=>!m.healthy_at_last_observation))flags.push('MARKET_COVERAGE_INCOMPLETE_AT_LAST_OBSERVATION');
 if(observedGaps.some(n=>n>25))flags.push('OBSERVED_SCHEDULE_GAP_OVER_25_MIN');
 if(recent.length===100)flags.push('RUN_LIST_POSSIBLY_TRUNCATED');
 return {
 schema:'invo-v7.8-reliability-audit-1',audited_utc:new Date(now).toISOString(),
 production_execution_changed:false,production_approval:false,
 heartbeat_utc:heartbeatValid?new Date(heartbeatT).toISOString():null,heartbeat_age_minutes:hbAge,
 latest_successful_research_run_utc:latestSuccess?.created_at||null,latest_successful_research_run_age_minutes:lastAge,
 latest_successful_scheduled_run_utc:latestScheduledSuccess?.created_at||null,
 observed_recent_runs:recent.length,observed_recent_scheduled_successes:scheduledSuccess.length,
 recent_scheduled_intervals_minutes:observedGaps,pending_research_run:pending,
 last_observation_market_coverage:markets,flags,
 status:flags.length?'REQUIRES_RELIABILITY_REVIEW':'OBSERVED_RECENT_NO_FLAGS',
 caveats:['A GitHub workflow run event=schedule does not prove it was the 15-minute cron rather than daily schedule.',
 'Scheduled times are best effort; missing cron slots cannot be inferred from a limited API page.',
 'Last observed market coverage is not the same as current freshness. No missed forward signals are reconstructed.',
 'This report only audits existing GitHub evidence and does not dispatch a fallback or change trading.']
 };
}
module.exports={assess};
