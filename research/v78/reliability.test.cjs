'use strict';
const assert=require('node:assert/strict'),{assess}=require('./reliability.cjs');
const now=Date.parse('2026-11-18T02:00:00Z');
const run=(date,event='schedule',conclusion='success')=>({name:'INVO Automated Paper Research',created_at:date,event,status:'completed',conclusion});
const health=(t)=>({observed_utc:t,expected_completed_candle_t:1794961800000,results:
 Object.fromEntries(['BTC','ETH','SOL','JUP'].map(c=>[c,{status:'OK',last_processed_completed_candle_t:1794961800000}]))});
const fresh=assess([run('2026-11-18T01:45:00Z')],health('2026-11-18T01:45:00Z'),now);
assert.equal(fresh.status,'OBSERVED_RECENT_NO_FLAGS');
assert.equal(fresh.production_approval,false);
const stale=assess([run('2026-11-18T00:30:00Z')],health('2026-11-18T00:30:00Z'),now);
assert.ok(stale.flags.includes('HEARTBEAT_STALE'));
assert.ok(stale.flags.includes('RESEARCH_RUN_STALE'));
const gap=assess([run('2026-11-18T01:10:00Z'),run('2026-11-18T01:55:00Z')],health('2026-11-18T01:55:00Z'),now);
assert.ok(gap.flags.includes('OBSERVED_SCHEDULE_GAP_OVER_25_MIN'));
const mismatch=health('2026-11-18T01:45:00Z');mismatch.results.BTC.last_processed_completed_candle_t-=300000;
assert.ok(assess([run('2026-11-18T01:45:00Z')],mismatch,now).flags.includes('MARKET_COVERAGE_INCOMPLETE_AT_LAST_OBSERVATION'));
assert.throws(()=>assess([],{},Infinity),/Invalid/);
console.log('Independent collector reliability diagnostics: offline tests passed');
