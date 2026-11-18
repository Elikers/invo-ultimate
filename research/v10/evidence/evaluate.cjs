'use strict';
/* Fail-closed independent forward profitability readiness. No auto promotion, no orders. */
function evaluate(x){
 if(!x||!Array.isArray(x.groups)||!Number.isSafeInteger(x.forward_trade_count)||x.forward_trade_count<0)
 throw Error('Unverifiable forward research summary');
 const blockers=[];
 if(x.groups.length!==8)blockers.push('EIGHT_SPECIALIST_GROUPS_NOT_REPRESENTED');
 if(x.forward_trade_count<100)blockers.push('LESS_THAN_100_CLOSED_FORWARD_TRADES');
 if(x.groups.some(g=>!Number.isSafeInteger(g.closed)||g.closed<0||typeof g.id!=='string'))
 throw Error('Invalid group count');
 for(const g of x.groups){
  if(g.closed<30)blockers.push('GROUP_SAMPLE_INSUFFICIENT_'+g.id);
  if(!Number.isFinite(g.lower_bound_95_net_pct)||g.lower_bound_95_net_pct<=0)
   blockers.push('NET_EXPECTANCY_NOT_ESTABLISHED_'+g.id);
 }
 if(!x.holdout_registration_immutable)blockers.push('HOLDOUT_OR_REGISTRATION_NOT_FROZEN');
 if(!x.matched_forward_baselines)blockers.push('NO_MATCHED_FIXED_ENGINE_BASELINES');
 if(!x.costs_verified)blockers.push('EXECUTION_COSTS_UNVERIFIED');
 if(!x.execution_fills_verified)blockers.push('REAL_EXECUTION_NOT_VERIFIED');
 if(!x.clustering_and_multiplicity_adjusted)blockers.push('CORRELATION_MULTIPLE_TESTING_NOT_RESOLVED');
 if(!x.drawdown_and_tails_reviewed)blockers.push('TAIL_RISK_NOT_REVIEWED');
 if(!x.data_gap_audit_passed)blockers.push('FEED_GAP_AUDIT_MISSING');
 if(!x.all_models_frozen_before_test)blockers.push('MODEL_VERSION_LEAKAGE_RISK');
 return {schema:'invo-v10-independent-readiness-1',status:blockers.length?'BLOCKED':'HUMAN_REVIEW_REQUIRED',
  blockers,automatic_production_promotion:false,live_orders_enabled:false,
  website_inference_enabled:false,evidence_not_proof_of_future_profit:true};
}
function mainSnapshot(main,registration){
 if(main?.schema!=='invo-v7.3-candidate-paper-summary-1'||registration?.schema!=='invo-v10-registered-specialists-1')
 throw Error('Source mismatch');
 const existingClosed=main.closed;
 if(!Number.isSafeInteger(existingClosed)||existingClosed<0)throw Error('Invalid production journal count');
 return {read_only_legacy_captured:main.total_captured,read_only_legacy_closed:existingClosed,
  eligible_v10_trades:0,reason:'Legacy candidate entries are not frozen MAHORAGA v10 model outputs; cannot count toward v10 forward evidence'};
}
module.exports={evaluate,mainSnapshot};
