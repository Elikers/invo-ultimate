/* INVO v6.8.2 — inspect GitHub scheduled-run evidence without inventing missing polls.
 * Best-effort cron monitoring only, never changes market signal/entry logic.
 */
'use strict';
const WORKFLOW='INVO Automated Paper Research',HOUR=3600000,MIN=60000;
const POLL='7,22,37,52 * * * *',DAILY='20 1 * * *';
function check(runs,now=Date.now(),opts={}){
 if(!Array.isArray(runs)||!Number.isFinite(now))throw Error('Invalid GitHub runs or time');
 const maxAge=opts.max_age_ms??2*HOUR,cadenceWindow=opts.cadence_window_ms??6*HOUR;
 if(!Number.isFinite(maxAge)||maxAge<=0||!Number.isFinite(cadenceWindow)||cadenceWindow<=0)throw Error('Invalid audit interval');
 const matching=runs.filter(r=>r?.name===WORKFLOW&&Number.isFinite(Date.parse(r.created_at)))
  .sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));
 const scheduled=matching.filter(r=>r.event==='schedule'),polls=scheduled.filter(r=>r.schedule===POLL);
 const successful=scheduled.filter(r=>r.status==='completed'&&r.conclusion==='success');
 const good=successful[0],lastRun=matching[0],lastScheduled=scheduled[0];
 const age=t=>t?Math.max(0,now-Date.parse(t)):null;
 const bootstrap=!!lastRun&&age(lastRun.created_at)<maxAge&&!scheduled.length;
 const healthy=!!good&&age(good.created_at)<=maxAge;
 const pending=scheduled.some(r=>['queued','in_progress','waiting','pending'].includes(r.status)&&age(r.created_at)<maxAge);
 const recentPolls=polls.filter(r=>age(r.created_at)<=cadenceWindow&&age(r.created_at)>=0);
 const pollSuccess=recentPolls.filter(r=>r.status==='completed'&&r.conclusion==='success');
 const times=pollSuccess.map(r=>Date.parse(r.created_at)).sort((a,b)=>a-b);
 const intervals=times.slice(1).map((t,i)=>Math.round((t-times[i])/MIN));
 const expected=Math.floor(cadenceWindow/(15*MIN));
 const hasScheduleMetadata=scheduled.some(r=>typeof r.schedule==='string'&&r.schedule.length>0);
 // listWorkflowRunsForRepo does not expose the triggering cron expression.
 // If metadata is absent, NEVER count the daily historical cron as a verified poll.
 const unclassified=scheduled.filter(r=>!r.schedule);
 const cadence={
  window_hours:cadenceWindow/HOUR,nominal_15min_slots:expected,
  classified_poll_successes:pollSuccess.length,
  unclassified_scheduled_successes:unclassified.filter(r=>age(r.created_at)<=cadenceWindow&&r.conclusion==='success').length,
  observed_scheduled_successes:successful.filter(r=>age(r.created_at)<=cadenceWindow).length,
  observed_vs_nominal_ratio:hasScheduleMetadata&&expected?Math.min(1,pollSuccess.length/expected):null,
  successful_intervals_minutes:intervals,
  cadence_status:!hasScheduleMetadata?'TRIGGER_CRON_NOT_EXPOSED_BY_API':
   times.length<2?'TOO_FEW_CLASSIFIED_POLLS':intervals.some(x=>x>25)?'GAPS_OVER_25_MINUTES':'RECENT_CLASSIFIED_INTERVALS_WITHIN_25_MIN',
  caveat:'GitHub Actions listWorkflowRunsForRepo does not normally expose cron expression. Unknown scheduled runs include the separate daily backtest; never represent them as verified 15-minute polls. API pages may omit older runs.'
 };
 return {status:healthy?'VERIFIED_SCHEDULE_RECENT':bootstrap?'AWAITING_FIRST_SCHEDULE':pending?'SCHEDULED_RUN_IN_PROGRESS':'SCHEDULE_UNVERIFIED_OR_STALE',
  observed_utc:new Date(now).toISOString(),last_research_run_utc:lastRun?.created_at||null,
  last_scheduled_run_utc:lastScheduled?.created_at||null,last_successful_scheduled_run_utc:good?.created_at||null,
  last_successful_scheduled_run_id:good?.id||null,scheduled_runs_in_window:scheduled.filter(r=>age(r.created_at)<=maxAge).length,
  latest_scheduled_conclusion:lastScheduled?.conclusion||null,pending_scheduled_run:pending,cadence,
  alert:!healthy&&!bootstrap&&!pending,
  warning:'A successful GitHub schedule, including the separate daily historical run, is not proof of a 15-minute poll. GitHub cron may be delayed or skipped.'
 };
}
module.exports={WORKFLOW,POLL,DAILY,check};
