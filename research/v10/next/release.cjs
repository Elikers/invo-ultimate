'use strict';
// Gate 5 fail-closed website/production readiness. Only returns a report, never a deploy instruction.
const REG=require('../learners/registration.json');
function audit(evidence,operational,approval){
 const blockers=[];
 if(!evidence||evidence.status!=='HUMAN_REVIEW_ONLY'||evidence.invalid!==0)
 blockers.push('INDEPENDENT_FORWARD_NET_EDGE_NOT_VERIFIED');
 if(!operational||operational.continuous_capture_verified!==true||
 operational.reconnect_and_clock_health_verified!==true||
 operational.durable_storage_verified!==true)
 blockers.push('CONTINUOUS_CAPTURE_UNPROVEN');
 if(!operational||operational.model_versions_frozen!==true||
 operational.rollback_rehearsed!==true||
 operational.quality_schema_verified!==true)blockers.push('MODEL_GOVERNANCE_NOT_AUDITED');
 if(!operational||operational.execution_costs_verified!==true||
 operational.drawdown_tail_review_passed!==true||
 operational.concentration_limits_reviewed!==true)
 blockers.push('RISK_AND_EXECUTION_UNVERIFIED');
 if(!operational||operational.all_eight_specialists_validated!==true)
 blockers.push('EIGHT_SPECIALISTS_NOT_VALIDATED');
 if(!approval||approval.explicit_human_website_activation!==true)
 blockers.push('NO_SEPARATE_HUMAN_ACTIVATION_APPROVAL');
 return {schema:'invo-v10-gate5-release-1',research_modules_verified:true,
  status:blockers.length?'BLOCKED':'MANUAL_REVIEW_ONLY',
  blockers,live_orders_allowed:false,website_active:false,
  automatic_promotion:false,production_strategy_mutation:false,
  future_profitable_trades_guaranteed:false,
  note:'This function NEVER authorizes production, even if all fields are true. Separate human change review is required.'};
}
module.exports={audit};
