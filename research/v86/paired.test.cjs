'use strict';const assert=require('node:assert/strict');const {evaluate}=require('./paired.cjs');
const registration={registered_utc:'2026-11-18T00:00:00Z',commit_sha:'a'.repeat(40)};
const t=Date.parse('2026-11-18T01:00:00Z');
const sample=(i)=>({id:'s'+i,market:'BTC',predicted_at:t+i*60000,outcome_at:t+(i+1)*60000,
  candidate_net_pct:.05,baseline_net_pct:.02,cost_verified:true});
assert.equal(evaluate(Array.from({length:12},(_,i)=>sample(i)),registration,t+86400000).outcome,'INSUFFICIENT_PAIRED_FORWARD_EVIDENCE');
assert.equal(evaluate(Array.from({length:100},(_,i)=>sample(i)),registration,t+86400000).automatic_promotion,false);
assert.throws(()=>evaluate([sample(0),sample(0)],registration,t+86400000),/Duplicate/);
assert.throws(()=>evaluate([{...sample(0),predicted_at:t-7200000}],registration,t+86400000),/chronology/);
assert.throws(()=>evaluate([{...sample(0),cost_verified:false}],registration,t+86400000),/Unverified/);
console.log('v8.6 AI-versus-baseline evaluation gate tests passed');
