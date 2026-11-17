const assert=require('node:assert/strict'),C=require('./collector-coverage.cjs');
const now=Date.parse('2026-11-18T08:00:00Z'),t=now-300000;
const ok={observed_utc:new Date(now-60000).toISOString(),expected_completed_candle_t:t,
results:Object.fromEntries(['BTC','ETH','SOL','JUP'].map(c=>[c,{status:'OK',last_processed_completed_candle_t:t}]))};
let a=C.assess(ok,now);
assert.equal(a.markets_with_current_completed_candle,4);
assert.deepEqual(a.flags,[]);
a=C.assess({...ok,results:{...ok.results,SOL:{status:'OK',last_processed_completed_candle_t:t-300000}}},now);
assert.equal(a.markets_with_current_completed_candle,3);
assert.ok(a.flags.includes('MARKET_CANDLE_BEHIND_EXPECTED'));
a=C.assess({...ok,expected_completed_candle_t:undefined},now);
assert.ok(a.flags.includes('CANDLE_FRESHNESS_UNVERIFIED'));
a=C.assess({...ok,observed_utc:new Date(now-60*60000).toISOString()},now);
assert.ok(a.flags.includes('COLLECTOR_HEARTBEAT_STALE_OR_MISSING'));
assert.throws(()=>C.assess(ok,NaN),/Invalid audit clock/);
console.log('INVO completed-candle coverage and heartbeat diagnostics tests passed');
