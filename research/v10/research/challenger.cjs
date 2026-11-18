'use strict';
// Deliberately non-promoting: v10.3 labels prohibit training, funding/fills unverified.
// Only produces proposals from separately verified future research evidence.
const RULES=Object.freeze({min_independent_runs:100,min_matured_executable_labels:100,
 min_observation_days:30,min_profit_factor:1.2,min_net_return:0,
 requires_verified_funding:true,requires_independent_attestation:true,
 champion_frozen:true,auto_promote:false,approved_for_live:false});
function gate(records){
 if(!Array.isArray(records))throw Error('Evidence array required');
 const unique=new Set(),days=new Set();let samples=0,grossPositive=0,grossNegative=0,netSum=0;
 for(const r of records){
  if(!r||typeof r!=='object')throw Error('Malformed evidence');
  if(!r.capture_run_id||typeof r.capture_run_id!=='string')throw Error('Missing run identity');
  if(unique.has(r.capture_run_id))throw Error('Duplicate evidence run');
  unique.add(r.capture_run_id);
  if(!r.verified_provenance||!r.matured||r.training_eligible!==true||
     r.funding_verified!==true||r.independently_attested!==true||
     r.actual_fills_verified!==true||!Number.isFinite(r.net_return))continue;
  if(!Number.isSafeInteger(r.decision_time_ms))throw Error('Missing time');
  samples++;days.add(new Date(r.decision_time_ms).toISOString().slice(0,10));
  netSum+=r.net_return;
  if(r.net_return>0)grossPositive+=r.net_return;
  else grossNegative-=r.net_return;
 }
 const factor=grossNegative>0?grossPositive/grossNegative:null;
 const passed=unique.size>=RULES.min_independent_runs&&samples>=RULES.min_matured_executable_labels&&
 days.size>=RULES.min_observation_days&&factor!==null&&
 factor>RULES.min_profit_factor&&netSum>RULES.min_net_return;
 return {schema:'mahoraga-v106-challenger-screen-v1',rules:RULES,
    observed_runs:unique.size,eligible_samples:samples,eligible_days:days.size,
    net_return_sum:samples?netSum:null,profit_factor:factor,
    candidate_research_screen_passed:passed,
    candidate_train_executed:false,champion_changed:false,auto_promoted:false,
    approved_for_live:false,status:passed?'REQUIRES_SEPARATE_MANUAL_RESEARCH_REVIEW':'BLOCKED_NO_QUALIFIED_EVIDENCE'};
}
module.exports={gate,RULES};
