/* INVO v6.8.2 — read-only decision for GitHub-only stale collector fallback.
 * This module only decides whether a lightweight workflow dispatch is appropriate.
 * It never reconstructs missing candles, changes paper trades, or sends orders.
 */
'use strict';
const NAME='INVO Automated Paper Research',MIN=60000;
function decide(runs,now=Date.now(),options={}){
 if(!Array.isArray(runs)||!Number.isFinite(now))throw Error('Invalid runs or current time');
 const threshold=options.stale_ms??40*MIN,cooldown=options.cooldown_ms??40*MIN;
 if(!Number.isFinite(threshold)||threshold<=0||!Number.isFinite(cooldown)||cooldown<=0)throw Error('Invalid fallback bounds');
 const relevant=runs.filter(x=>x&&x.name===NAME&&Number.isFinite(Date.parse(x.created_at)))
  .sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));
 const age=x=>Math.max(0,now-Date.parse(x.created_at));
 const lastSuccess=relevant.find(x=>x.status==='completed'&&x.conclusion==='success');
 const pending=relevant.find(x=>['queued','waiting','pending','in_progress','requested'].includes(x.status)&&age(x)<threshold);
 const recentDispatch=relevant.find(x=>x.event==='workflow_dispatch'&&age(x)<cooldown);
 const recentFailed=relevant.find(x=>x.status==='completed'&&x.conclusion!=='success'&&age(x)<15*MIN);
 const result={should_dispatch:!lastSuccess||age(lastSuccess)>threshold,
  reason:'RESEARCH_STALE',last_successful_run_utc:lastSuccess?.created_at||null,
  latest_research_run_utc:relevant[0]?.created_at||null,
  warning:'Fallback is best effort and must not be interpreted as reconstructed missed forward signals.'};
 if(!result.should_dispatch){result.reason='RECENT_SUCCESS';return result}
 if(pending){result.should_dispatch=false;result.reason='RESEARCH_IN_PROGRESS';return result}
 if(recentDispatch){result.should_dispatch=false;result.reason='DISPATCH_COOLDOWN';return result}
 if(recentFailed){result.should_dispatch=false;result.reason='RECENT_FAILED_RUN_GRACE';return result}
 return result;
}
module.exports={NAME,decide};
