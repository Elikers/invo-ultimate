const assert=require('node:assert/strict'),F=require('./v7-forward-gate.cjs');
const reg={schema:'invo-v7.3-prospective-registration-1',registered_utc:'2026-11-18T00:00:00Z',
 minimums:{closed_overall:100,closed_per_market_strategy_candidate:30},preregistered_pairs:[{coin:'JUP',strategy:'volbreak'}],
 candidates:[{id:'A'},{id:'B'}]};
const journal={schema:'invo-v6.3-forward-1',markets:{JUP:{observations:[{status:'CLOSED',strategy:'volbreak'}]}}};
const out=F.evaluate(reg,journal,[{coin:'JUP'}],'2026-11-18T01:00:00Z');
assert.equal(out.baseline_forward_closed,1);
assert.equal(out.candidates.length,2);
assert.equal(out.candidates[0].prospective_candidate_closed,0);
assert.equal(out.approved_candidates,0);
assert.equal(out.permission_to_change_production,false);
assert.throws(()=>F.evaluate(reg,journal,[], '2026-11-18T01:00:00Z'),/Unexpected/);
assert.throws(()=>F.evaluate(reg,journal,[{}],'2026-11-17T01:00:00Z'),/future-dated/);
console.log('INVO v7.3 no-backfill prospective research gate tests passed');
