'use strict';
const assert=require('node:assert/strict'),M=require('./meta.cjs'),R=require('../learners/registration.json');
const t=Date.parse('2026-11-19T00:00:00Z');
const row=(n)=>({predicted_at_ms:t+n*60000,feature_available_ms:t+n*60000,source_verified:true,
 experts:R.experts.map((expert,i)=>({expert,side:i<6?'LONG':'NONE',probability:.7,reliability:.8,
 model_frozen_before_prediction:true,predicted_at_ms:t+n*60000})),
 purpose:'TRAIN',split:'train',label_source:'MATURED_FROZEN_PAPER_SIM',
 matured_at_ms:t+n*60000+30000,registration_locked:true,gross_paper_pct:.4,cost_bps:16});
let m=M.init('frozen-meta-v10-01');assert.equal(M.advisory(m,row(0),{}).side,'NONE');
for(let i=0;i<40;i++)m=M.train(m,row(i));
assert.equal(m.updates,40);
assert.ok(M.predict(m,row(41))>0);
assert.equal(M.advisory(m,row(41),{verified_data:false,costs_sourced:true,held_out_model_version:true}).side,'NONE');
const a=M.advisory(m,row(41),{verified_data:true,costs_sourced:true,held_out_model_version:true});
assert.equal(a.trade_authorized,false);assert.equal(a.production_promotion,false);
assert.throws(()=>M.train(m,{...row(41),split:'test'}),/Invalid/);
assert.throws(()=>M.train(m,{...row(41),feature_available_ms:t+41*60000+1}),/Untrusted/);
assert.throws(()=>M.train(m,{...row(41),matured_at_ms:m.last_matured_ms}),/Invalid/);
assert.throws(()=>M.vector({...row(41),experts:row(41).experts.slice(1)}),/Untrusted/);
assert.equal(M.fingerprint(m).length,64);
console.log('GATE 3 trained research net meta-learner, frozen votes, abstention, no orders PASS');
