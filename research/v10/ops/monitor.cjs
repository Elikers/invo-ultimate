'use strict';
// v10.8 research operations monitor. Monitoring is not scheduling, backups or trading.
const R=require('../forward/registration.json');
const START=Date.parse(R.start_utc),LIMIT=6*3600000;
function reject(m){throw Error(m)}
function assess(now,rec=[],runs=[],options={}){
 if(!Number.isSafeInteger(now)||!Array.isArray(rec)||!Array.isArray(runs))reject('Invalid monitor input');
 const flags=[],notes=[];
 const emit=(severity,code,detail)=>flags.push({severity,code,detail});
 if(!options.collector_scheduled)
   emit('BLOCKER','RECURRING_COLLECTOR_NOT_DEPLOYED','Research-branch workflows cannot supply default-branch cron alone');
 if(!options.offsite_backup_verified)
   emit('BLOCKER','INDEPENDENT_OFFSITE_BACKUP_NOT_VERIFIED','GitHub Actions artifacts are expiring, GitHub release upload may be unavailable');
 if(!options.independent_attestation_verified)
   emit('BLOCKER','EXTERNAL_TIMESTAMP_ATTESTATION_MISSING','GitHub artifact hashes are not independent time anchoring');
 if(now<START)notes.push('PRE_REGISTRATION_NO_PROSPECTIVE_EVIDENCE_EXPECTED');
 else{
  const observed=rec.flatMap(x=>Array.isArray(x.observations)?x.observations:[]);
  if(!observed.length)emit('BLOCKER','NO_REGISTERED_FORWARD_OBSERVATIONS','No authenticated post-registration prediction receipts');
  else{
   const last=Math.max(...observed.map(x=>x.decision_time_ms));
   if(!Number.isSafeInteger(last)||now-last>LIMIT)emit('BLOCKER','STALE_FORWARD_OBSERVATIONS','Last recorded prediction older than 6h');
   for(const x of observed){
    if(x.mature_after_ms+R.exit_tolerance_ms<now&&!options.matured_ids?.includes(x.id))
     emit('WARNING','UNMATCHED_MATURED_OBSERVATION',x.id);
    if(x.decision_time_ms<START)emit('BLOCKER','PRE_REGISTRATION_OBSERVATION',x.id);
   }
  }
 }
 for(const r of rec){
  if(r.live_orders!==false||r.training_eligible!==false||r.independent_external_attestation!==false||
     !Array.isArray(r.gaps)||!Array.isArray(r.observations))
    emit('BLOCKER','UNTRUSTED_CAPTURE_RECEIPT','Receipt breaches frozen no-trading contract');
  if(r.gaps?.length)notes.push('SOURCE_GAPS_OBSERVED:'+r.gaps.length);
 }
 for(const run of runs){
  if(!run||!['success','failure','cancelled','timed_out','in_progress','queued'].includes(run.conclusion||run.status))
    emit('WARNING','UNKNOWN_RUN_STATUS',String(run?.id||'missing'));
  if(['failure','timed_out'].includes(run.conclusion))emit('BLOCKER','WORKFLOW_FAILED',String(run.id));
 }
 if(options.unsupported_profit_claim===true)emit('BLOCKER','UNSUPPORTED_PROFITABILITY_CLAIM','Full trading costs or independent forward evidence missing');
 if(options.production_changed===true)emit('BLOCKER','UNAUTHORIZED_PRODUCTION_CHANGE','Production strategy/risk freeze violated');
 return {schema:'mahoraga-v108-operations-audit-v1',at_ms:now,
    registered_at_ms:START,flags,notes,blockers:flags.filter(f=>f.severity==='BLOCKER').length,
    monitoring_deployed_continuously:false,scheduled_capture_verified:options.collector_scheduled===true,
    durable_independent_backup_verified:options.offsite_backup_verified===true,
    independent_forward_evidence_verified:false,
    trading_enabled:false,automatic_promotion:false,
    status:flags.some(f=>f.severity==='BLOCKER')?'RESEARCH_BLOCKED':'RESEARCH_UNDER_OBSERVATION'};
}
module.exports={assess};
