const assert=require('node:assert/strict'),D=require('./v7-loss.cjs');
const j={schema:'invo-v6.3-forward-1',updated_utc:'2026-11-18T00:00:00Z',markets:{BTC:{observations:[
 {strategy:'sweep',status:'CLOSED',gross_pct:.12,reason:'TIME'},
 {strategy:'pullback',status:'CLOSED',gross_pct:-.4,reason:'STOP'},
 {strategy:'mean',status:'OPEN'}]}}};
const a=D.diagnose(j);
assert.equal(a.closed,2);assert.equal(a.unfinished,1);
assert.equal(a.outcomes.COST_ERASES_GROSS_AT_16BPS,1);
assert.equal(a.outcomes.PRICE_MOVEMENT_NONPOSITIVE,1);
assert.equal(a.fixed_cost_stress_bps['8'].winning,1);
assert.equal(a.exit_reasons.STOP.count,1);
assert.equal(a.by_market_strategy['BTC|sweep'].closed,1);
assert.throws(()=>D.diagnose({}),/Unexpected/);
assert.throws(()=>D.diagnose({schema:j.schema,markets:{BTC:{observations:[{status:'CLOSED'}]}}}),/Missing validated/);
console.log('INVO v7.0 loss-attribution tests passed');
