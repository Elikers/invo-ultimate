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
const candidate={schema:'invo-v7.3-candidate-paper-1',registered_utc:reg.registered_utc,
 markets:{JUP:{observations:[{id:'JUP|volbreak|A|1',coin:'JUP',strategy:'volbreak',variant:'A',
  status:'CLOSED',model:'EXPERIMENTAL_DELAYED_PAPER_ONLY',
  observed_at_utc:'2026-11-18T00:01:00Z',net_pct:{'16':-.12}}]}}};
const live=F.evaluate(reg,journal,[{coin:'JUP'}],'2026-11-18T01:00:00Z',candidate);
assert.equal(live.candidates[0].prospective_candidate_closed,1);
assert.equal(live.candidates[0].status,'FRESH_CANDIDATE_PAPER_SAMPLE_INSUFFICIENT');
assert.equal(live.candidates[1].prospective_candidate_closed,0);
assert.equal(live.approved_candidates,0);
assert.throws(()=>F.evaluate(reg,journal,[{}],'2026-11-18T01:00:00Z',{...candidate,registered_utc:'2026-11-17T00:00:00Z'}),/provenance mismatch/);
assert.throws(()=>F.evaluate(reg,journal,[{}],'2026-11-18T01:00:00Z',
 {...candidate,markets:{JUP:{observations:[{...candidate.markets.JUP.observations[0],observed_at_utc:'2026-11-17T00:00:00Z'}]}}}),/provenance invalid/);
console.log('INVO v7.3 no-backfill prospective research gate tests passed');
