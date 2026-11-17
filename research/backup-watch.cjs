/* INVO v6.9 Phase 5 — independent GitHub artifact/recovery health policy.
 * Never changes research files or restores a journal in place.
 */
'use strict';
const RESEARCH='INVO Automated Paper Research',RESTORE='INVO Independent Backup Restore Check';
function check(runs,artifacts,now=Date.now(),options={}){
 if(!Array.isArray(runs)||!Array.isArray(artifacts)||!Number.isFinite(now))throw Error('Invalid backup audit input');
 const freshMs=options.fresh_ms??3*3600000;
 if(!Number.isFinite(freshMs)||freshMs<=0)throw Error('Invalid freshness threshold');
 const age=r=>Math.max(0,now-Date.parse(r?.created_at||''));
 const order=arr=>arr.filter(x=>Number.isFinite(Date.parse(x.created_at))).sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));
 const research=order(runs.filter(x=>x.name===RESEARCH&&x.status==='completed'&&x.conclusion==='success'));
 const checks=order(runs.filter(x=>x.name===RESTORE&&x.status==='completed'&&x.conclusion!=='skipped'));
 const last=research[0],latestCheck=checks[0],lastGood=checks.find(x=>x.conclusion==='success');
 const named=last?artifacts.filter(a=>a.name==='invo-research-'+last.id&&!a.expired):[];
 const flags=[];
 if(!last)flags.push('NO_SUCCESSFUL_RESEARCH_RUN');
 else if(age(last)>freshMs)flags.push('LATEST_RESEARCH_STALE');
 if(!lastGood)flags.push('NO_SUCCESSFUL_RESTORE_CHECK');
 else if(age(lastGood)>freshMs)flags.push('RESTORE_VERIFICATION_STALE');
 if(latestCheck&&latestCheck.conclusion==='failure'&&(lastGood===undefined||Date.parse(latestCheck.created_at)>Date.parse(lastGood.created_at)))flags.push('LATEST_RESTORE_FAILED');
 if(last&&!named.length)flags.push('LATEST_RESEARCH_ARTIFACT_NOT_FOUND');
 if(named.length>1)flags.push('MULTIPLE_IDENTICAL_ARTIFACTS');
 return {schema:'invo-v6.9-backup-watch-1',status:flags.length?'ACTION_REQUIRED':'GITHUB_BACKUP_RECENTLY_VERIFIED',
  checked_utc:new Date(now).toISOString(),flags,latest_research_run_id:last?.id||null,
  latest_research_run_utc:last?.created_at||null,latest_restore_run_id:latestCheck?.id||null,
  latest_restore_conclusion:latestCheck?.conclusion||null,
  last_successful_restore_utc:lastGood?.created_at||null,verified_artifact_count:named.length,
  scope:'GITHUB_ONLY; does not verify independent Google Drive backups or personal Gmail Apps Script trigger.',
  warning:'Checks GitHub run/artifact metadata, not all ZIP bytes. Separate restore checks validate checksum contents. GitHub API history may be incomplete.'};
}
module.exports={check,RESEARCH,RESTORE};
