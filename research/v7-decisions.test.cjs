const assert=require('node:assert/strict'),D=require('./v7-decisions.cjs');
const loss={schema:'invo-v7.0-loss-attribution-1',closed:12};
const robustness={schema:'invo-v7.2-robustness-1',tested_candidates:6,historical_screen_count:0,
 rows:Array.from({length:6},(_,i)=>({net_16bps_pct:-.2}))};
const forward={schema:'invo-v7.3-forward-gate-1',experimental_captured:3,
 candidates:[{prospective_candidate_closed:0,minimum_required:30}]};
const reg={schema:'invo-v7.3-prospective-registration-1',minimums:{closed_overall:100}};
const x=D.decide(loss,robustness,forward,[{},{}],reg);
assert.equal(x.approved_candidate_count,0);
assert.equal(x.permission_to_change_production,false);
assert.ok(x.blockers.includes('BASELINE_FORWARD_SAMPLE_BELOW_100'));
assert.ok(x.blockers.includes('CANDIDATE_FORWARD_GROUP_SAMPLE_BELOW_30'));
assert.equal(x.evidence.positive_net_at_16bps_scenarios,0);
assert.throws(()=>D.decide(loss,robustness,forward,[],reg),/Research budget/);
assert.throws(()=>D.decide({},robustness,forward,[{},{}],reg),/Missing verified/);
console.log('INVO v7.4 no-automatic-promotion profitability decision tests passed');
