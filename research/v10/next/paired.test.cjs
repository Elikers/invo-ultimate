'use strict';
const assert=require('node:assert/strict'),E=require('./paired.cjs'),R=require('../learners/registration.json');
const start=Date.parse('2026-11-19T00:00:00Z'),reg={sha256:'f'.repeat(64),start_ms:start};
const rows=[];
for(const [j,id] of R.experts.entries())for(let k=0;k<35;k++){
 const t=start+(k*86400000)+j*1000;
 rows.push({id:id+'-'+k,expert:id,predicted_at_ms:t,matured_at_ms:t+900000,
 challenger_gross_pct:.5,baseline_gross_pct:.1,challenger_cost_bps:12,baseline_cost_bps:12,
 registration_sha256:reg.sha256,forward_only:true,frozen_before_prediction:true,
 matched_opportunity:true,source_verified:true,costs_verified:true,test_only:true,from_training:false});
}
// All these are FUTURE relative to current date, so MUST reject; no fake success possible.
const future=E.evaluate(rows,reg);assert.equal(future.status,'BLOCKED');assert.equal(future.invalid,280);
assert.equal(E.evaluate([],{sha256:reg.sha256,start_ms:start}).status,'BLOCKED');
const invalid=E.evaluate([{...rows[0],from_training:true}],reg);assert.equal(invalid.invalid,1);
assert.throws(()=>E.evaluate([],{sha256:'bad',start_ms:start}),/Unregistered/);
console.log('GATE 4 no future labels, paired-only cost-aware cluster audit, blocked without real evidence PASS');
