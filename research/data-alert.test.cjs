const assert=require('node:assert/strict'),D=require('./data-alert.cjs');
const now=Date.parse('2026-11-18T12:00:00Z'),end=now-300000;
const ok={observed_utc:new Date(now-10000).toISOString(),expected_completed_candle_t:end,
 results:Object.fromEntries(['BTC','ETH','SOL','JUP'].map(c=>[c,{status:'OK',last_processed_completed_candle_t:end}]))};
assert.equal(D.evaluate(ok,now).status,'HEALTHY_AT_LAST_OBSERVATION');
assert.equal(D.evaluate({...ok,results:{...ok.results,ETH:{status:'UNAVAILABLE'}}},now).issues.includes('MARKET_NOT_OK_ETH'),true);
assert.equal(D.evaluate({...ok,results:{...ok.results,BTC:{status:'OK',last_processed_completed_candle_t:end-300000}}},now).issues.includes('MARKET_CANDLE_LAG_BTC'),true);
assert.equal(D.evaluate({...ok,observed_utc:new Date(now-3600000).toISOString()},now).issues.includes('STALE_HEARTBEAT'),true);
assert.equal(D.evaluate({...ok,expected_completed_candle_t:undefined},now).issues.includes('CANDLE_TIMESTAMP_UNVERIFIED'),true);
console.log('INVO v6.9 Phase 1 data-quality alert tests passed');
