'use strict';
// This gate is stricter than positive paper P&L: no automatic promotion ever.
// Uses existing preregistered matched forward evaluation but does not invent rows.
const REG=require('../learners/registration.json');
const P=require('../next/paired.cjs');
const RELEASE=require('../next/release.cjs');
function audit({pairedRows=[],registeredExperiment,feed={},models={},execution={},security={},human={}}){
 if(!registeredExperiment||!/^[a-f0-9]{64}$/.test(registeredExperiment.sha256)||
 !Number.isSafeInteger(registeredExperiment.start_ms))throw Error('Missing frozen forward experiment registration');
 const paired=P.evaluate(pairedRows,registeredExperiment);
 const blockers=[...paired.blockers];
 if(paired.invalid)blockers.push('INVALID_FORWARD_PROVENANCE');
 if(feed.continuous_capture_verified!==true||feed.reconnect_recovery_verified!==true||
 feed.clock_sync_verified!==true||feed.durable_external_storage_verified!==true||
 feed.gap_quarantine_audited!==true)blockers.push('FEED_NOT_OPERATIONALLY_VERIFIED');
 if(models.all_eight_specialists_trained!==true||models.supervisor_trained_on_independent_data!==true||
 models.versions_frozen_before_forward_test!==true||models.rollback_drill_passed!==true)
 blockers.push('MODEL_COVERAGE_OR_GOVERNANCE_UNPROVEN');
 if(execution.fees_verified!==true||execution.slippage_stress_verified!==true||
 execution.funding_verified!==true||execution.real_fills_verified!==true||
 execution.drawdowns_reviewed!==true)
 blockers.push('ECONOMIC_EXECUTION_UNVERIFIED');
 if(security.backups_restore_tested!==true||security.stale_feed_cutoff_tested!==true||
 security.order_path_separated!==true||security.audit_log_externally_anchored!==true)
 blockers.push('SECURITY_OPERATIONAL_REVIEW_INCOMPLETE');
 const release=RELEASE.audit({status:paired.status,invalid:paired.invalid},{
  continuous_capture_verified:feed.continuous_capture_verified===true,
  reconnect_and_clock_health_verified:feed.reconnect_recovery_verified===true&&feed.clock_sync_verified===true,
  durable_storage_verified:feed.durable_external_storage_verified===true,
  model_versions_frozen:models.versions_frozen_before_forward_test===true,
  rollback_rehearsed:models.rollback_drill_passed===true,
  quality_schema_verified:feed.gap_quarantine_audited===true,
  execution_costs_verified:execution.fees_verified===true&&execution.funding_verified===true,
  drawdown_tail_review_passed:execution.drawdowns_reviewed===true,
  concentration_limits_reviewed:execution.concentration_reviewed===true,
  all_eight_specialists_validated:models.all_eight_specialists_trained===true
 },{explicit_human_website_activation:human.explicit_human_website_activation===true});
 return {schema:'invo-v10-all12-independent-release-audit-1',
  status:blockers.length?'BLOCKED':'HUMAN_REVIEW_ONLY',
  blockers,paired_summary:{records:paired.records,invalid:paired.invalid,
   groups:paired.groups.map(x=>({expert:x.expert,closed:x.closed,
    paired_net_advantage_pct:x.paired_net_advantage_pct,
    robust_lower_pct:x.conservative_cluster_lower_pct,
    proven:x.independent_advantage_demonstrated}))},
  release_gate:release.status,
  activation_authorized:false,production_trading_enabled:false,
  model_promotion_enabled:false,profitability_guaranteed:false};
}
module.exports={audit};
