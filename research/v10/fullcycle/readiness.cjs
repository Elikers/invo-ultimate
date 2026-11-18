'use strict';
// Stage 12 no-order final safe status. Only a human can authorize another reviewed phase.
const R=require('../next/release.cjs');
const REG=require('../shadow/registration.json');
function status({source,storage,models,outcomes,evaluation,security,explicitApproval}={}){
 const blockers=[];
 if(!source?.continuous_hours_verified||source.continuous_hours_verified<72||
 !source.reconnect_verified||!source.clock_verified||!source.feed_completeness_audited)
 blockers.push('CONTINUOUS_SOURCE_UNPROVEN');
 if(!storage?.external_retention_verified||!storage?.restore_drill_passed||
 !storage?.independent_timestamp_anchor)
 blockers.push('DURABLE_EVIDENCE_UNVERIFIED');
 if(!models?.all_eight_versioned||!models?.scalping_registered_features||
 !models?.meta_challenger_retrained||!models?.rollback_drill_passed)
 blockers.push('FULL_EIGHT_PLUS_SUPERVISOR_COVERAGE_MISSING');
 if(!outcomes?.paper_labels_matured||!outcomes?.cost_stress_reviewed||
 !outcomes?.no_trade_gap_audited)blockers.push('OUTCOME_AND_COSTS_INCOMPLETE');
 if(evaluation?.independent_forward_status!=='HUMAN_REVIEW_REQUIRED'||
 !evaluation?.all_markets_matched||!evaluation?.tail_risk_reviewed)
 blockers.push('PROSPECTIVE_NET_EDGE_NOT_ESTABLISHED');
 if(!security?.least_privilege||!security?.fault_tests_passed||
 !security?.backup_integrity_verified)
 blockers.push('RELEASE_SECURITY_NOT_READY');
 if(explicitApproval!==true)blockers.push('SEPARATE_HUMAN_APPROVAL_REQUIRED');
 return {schema:'invo-v10-twelve-track-readiness-1',specialist_count:REG.specialists.length,
  development_tracks:12,software_research_only:true,
  status:blockers.length?'BLOCKED':'MANUAL_EXTERNAL_REVIEW_ONLY',blockers,
  live_orders_allowed:false,website_signals_active:false,
  automated_champion_promotion:false,change_to_production_risk:false,
  profitability_guaranteed:false};
}
module.exports={status};
