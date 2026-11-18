'use strict';const assert=require('node:assert/strict');const {inspect}=require('./collector-gate.cjs');
const t=Date.parse('2026-11-18T01:00:00Z'),complete=t-300000;
const h={observed_utc:new Date(t).toISOString(),expected_completed_candle_t:complete,
results:Object.fromEntries(['BTC','ETH','SOL','JUP'].map(m=>[m,{status:'OK',last_processed_completed_candle_t:complete}]))};
assert.equal(inspect(h,t).status,'LAST_OBSERVATION_RECENT');
assert.ok(inspect(h,t+46*60000).flags.includes('STALE_HEARTBEAT'));
const broken=structuredClone(h);broken.results.JUP.last_processed_completed_candle_t-=300000;
assert.ok(inspect(broken,t).flags.includes('MARKET_COVERAGE_UNVERIFIED'));
assert.ok(inspect({},t).flags.includes('INVALID_HEARTBEAT_TIME'));
assert.equal(inspect(h,t).forward_events_fabricated,0);
console.log('v8.2 collector freshness diagnostics verified');
