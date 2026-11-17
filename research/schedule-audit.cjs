/* INVO v6.7.1 — independent schedule reliability audit; NEVER places orders.
 * Uses verified GitHub Actions run events, not only the last collector heartbeat.
 */
'use strict';
const WORKFLOW='INVO Automated Paper Research',HOUR=3600000;
function check(runs,now=Date.now(),opts={}){
 if(!Array.isArray(runs)||!Number.isFinite(now))throw Error('Invalid GitHub runs or time');
 const maxAge=opts.max_age_ms??2*HOUR;
 if(!Number.isFinite(maxAge)||maxAge<=0)throw Error('Invalid maximum age');
 const matching=runs.filter(r=>r.name===WORKFLOW).sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));
 const scheduled=matching.filter(r=>r.event==='schedule');
 const good=scheduled.find(r=>r.status==='completed'&&r.conclusion==='success');
 const lastGood=good?.created_at||null;
 const lastScheduled=scheduled[0]?.created_at||null;
 const lastRun=matching[0]?.created_at||null;
 const age=t=>t?Math.max(0,now-Date.parse(t)):null;
 const bootstrap=matching.length>0&&age(lastRun)<maxAge&&!scheduled.length;
 const healthy=!!good&&age(lastGood)<=maxAge;
 const pending=scheduled.some(r=>r.status==='queued'||r.status==='in_progress'||r.status==='waiting');
 const cadenceWindow=opts.cadence_window_ms??6*HOUR;
 const observed=scheduled.filter(r=>age(r.created_at)<=cadenceWindow&&r.status==='completed'&&r.conclusion==='success');
 const successTimes=observed.map(r=>Date.parse(r.created_at)).sort((a,b)=>a-b);
 const intervals=successTimes.slice(1).map((t,i)=>Math.round((t-successTimes[i])/60000));
 const expected=Math.floor(cadenceWindow/(15*60000));
 const cadence={window_hours:cadenceWindow/HOUR,nominal_15min_slots:expected,observed_scheduled_successes:observed.length,
  observed_vs_nominal_ratio:expected?Math.min(1,observed.length/expected):null,
  successful_intervals_minutes:intervals,
  cadence_status:observed.length<2?'TOO_FEW_SCHEDULED_SUCCESSES':intervals.some(x=>x>25)?'GAPS_OVER_25_MINUTES':'OBSERVED_RECENT_INTERVALS_WITHIN_25_MIN',
  caveat:'Counts all GitHub scheduled research events, including the daily cron; 15-minute cron is best-effort and history may be incomplete if API pagination truncates.'};
 const result={
  status:healthy?'VERIFIED_SCHEDULE_RECENT':bootstrap?'AWAITING_FIRST_SCHEDULE':pending?'SCHEDULED_RUN_IN_PROGRESS':'SCHEDULE_UNVERIFIED_OR_STALE',
  observed_utc:new Date(now).toISOString(),last_research_run_utc:lastRun,
  last_scheduled_run_utc:lastScheduled,last_successful_scheduled_run_utc:lastGood,
  last_successful_scheduled_run_id:good?.id||null,
  scheduled_runs_in_window:scheduled.filter(r=>age(r.created_at)<=maxAge).length,
  latest_scheduled_conclusion:scheduled[0]?.conclusion||null,
  pending_scheduled_run:pending,cadence,
  alert:!healthy&&!bootstrap&&!pending,
  warning:'GitHub Actions cron is best-effort. An absent successful schedule is not proof of a market-data failure; inspect trigger, job and permissions.'
 };
 return result;
}
module.exports={WORKFLOW,check};
