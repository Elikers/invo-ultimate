'use strict';const assert=require('node:assert/strict'),E=require('./evaluate.cjs'),R=require('../learners/registration.json');
const input={forward_trade_count:0,groups:R.experts.map(id=>({id,closed:0,lower_bound_95_net_pct:null})),
 holdout_registration_immutable:false,matched_forward_baselines:false,costs_verified:false,
 execution_fills_verified:false,clustering_and_multiplicity_adjusted:false,
 drawdown_and_tails_reviewed:false,data_gap_audit_passed:false,all_models_frozen_before_test:false};
const x=E.evaluate(input);assert.equal(x.status,'BLOCKED');
assert.equal(x.live_orders_enabled,false);assert.equal(x.website_inference_enabled,false);
assert.ok(x.blockers.includes('LESS_THAN_100_CLOSED_FORWARD_TRADES'));
const ideal={...input,forward_trade_count:320,groups:R.experts.map(id=>({id,closed:40,lower_bound_95_net_pct:.01})),
 holdout_registration_immutable:true,matched_forward_baselines:true,costs_verified:true,
 execution_fills_verified:true,clustering_and_multiplicity_adjusted:true,
 drawdown_and_tails_reviewed:true,data_gap_audit_passed:true,all_models_frozen_before_test:true};
const y=E.evaluate(ideal);assert.equal(y.status,'HUMAN_REVIEW_REQUIRED');
assert.equal(y.automatic_production_promotion,false);
assert.equal(E.mainSnapshot({schema:'invo-v7.3-candidate-paper-summary-1',total_captured:3,closed:0},R).eligible_v10_trades,0);
assert.throws(()=>E.evaluate({...input,groups:[{id:'fusion',closed:-1}]}),/Invalid group/);
console.log('MAHORAGA E independent profitability and non-promotion blocker gates PASS');
