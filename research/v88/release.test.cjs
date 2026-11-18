'use strict';const assert=require('node:assert/strict');const {judge}=require('./release.cjs');
const good={forward_closed:120,market_groups:[{market:'BTC',closed:40},{market:'ETH',closed:40},{market:'SOL',closed:40}],
 preregistered:true,independent_forward_period:true,realistic_costs_verified:true,
 no_missing_data_gaps:true,lower_95_pct:.02,max_drawdown_pct:10,multiple_testing_controlled:true};
assert.equal(judge(good).research_review_status,'MANUAL_INDEPENDENT_REVIEW_REQUIRED');
assert.equal(judge(good).production_promotion_allowed,false);
const bad={...good,forward_closed:19,market_groups:[{market:'BTC',closed:0}],realistic_costs_verified:false,
 lower_95_pct:null,no_missing_data_gaps:false};
assert.equal(judge(bad).research_review_status,'REJECT_OR_HOLD');
assert.ok(judge(bad).failed_gates.includes('FORWARD_TOTAL_BELOW_100'));
assert.throws(()=>judge({...good,forward_closed:-1}),/Invalid/);
console.log('v8.8 fail-closed independent promotion gate tests passed');
