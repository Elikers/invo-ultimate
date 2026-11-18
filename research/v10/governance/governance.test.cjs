'use strict';const assert=require('node:assert/strict'),G=require('./governance.cjs');
const a=G.checkpoint({weights:[0,1],version:0},{registration_sha:'a'.repeat(40)});
const b=G.checkpoint({weights:[0,2],version:1},{registration_sha:'a'.repeat(40),parent_sha256:a.model_sha256});
assert.notEqual(a.model_sha256,b.model_sha256);assert.equal(b.production_eligible,false);
assert.equal(G.drift(Array(29).fill(1),Array(30).fill(0)).status,'INSUFFICIENT_CLUSTERED_OUTCOMES');
const drift=G.drift(Array(30).fill(1),Array(30).fill(0));assert.equal(drift.drift_flagged,true);
assert.equal(drift.statistical_significance_claimed,false);
const points=Array.from({length:35},()=>({champion_net_pct:0,challenger_net_pct:.2,pre_registered:true,
 forward_only:true,costs_verified:true,matured:true,from_training:false}));
assert.equal(G.challenge(a,b,points).action,'INDEPENDENT_AUDIT_REQUIRED');
assert.equal(G.challenge(a,b,points.slice(0,10)).action,'HOLD_CHAMPION');
assert.equal(G.challenge(a,b,points.map(p=>({...p,from_training:true}))).action,'HOLD_CHAMPION');
assert.equal(G.challenge(a,b,points.map(p=>({...p,challenger_net_pct:-.1}))).action,'ROLLBACK_CHALLENGER_RESEARCH');
assert.throws(()=>G.checkpoint({weights:[NaN],version:0},{registration_sha:'a'.repeat(40)}),/Unversioned/);
console.log('MAHORAGA D model checkpoint, drift alert and no-auto-promotion PASS');
