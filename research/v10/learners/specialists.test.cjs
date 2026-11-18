'use strict';
const assert=require('node:assert/strict'),M=require('./specialists.cjs'),R=require('./registration.json');
const fs=()=>({trend:1,volatility:1,volume_ratio:2,spread_bps:5,order_imbalance:.5,funding:.0001,open_interest_change:.2});
const t=Date.parse('2026-11-19T00:00:00Z');
for(const expert of R.experts){
 const a=M.create(expert),b=M.update(a,{expert,purpose:'TRAIN',
 label_source:'MATURED_FROZEN_PAPER_SIM',predicted_at_ms:t,matured_at_ms:t+60000,
 available_to_model_ms:t,win_label:1,features:fs(),registration_locked:true,source_verified:true});
 assert.equal(a.updates,0);assert.equal(b.next.updates,1);
 assert.notEqual(M.fingerprint(a),M.fingerprint(b.next));
 assert.ok(M.probability(b.next,fs())>0.5);
 assert.throws(()=>M.update(b.next,{expert,purpose:'TRAIN',label_source:'MATURED_FROZEN_PAPER_SIM',
 predicted_at_ms:t,matured_at_ms:t+60000,available_to_model_ms:t,win_label:1,features:fs(),
 registration_locked:true,source_verified:true}),/chronology/);
}
const a=M.create('fusion');
const row={expert:'fusion',purpose:'TRAIN',label_source:'MATURED_FROZEN_PAPER_SIM',
 predicted_at_ms:t,matured_at_ms:t+60000,available_to_model_ms:t,win_label:0,features:fs(),
 registration_locked:true,source_verified:true};
assert.throws(()=>M.update(a,{...row,purpose:'TEST'}),/chronology/);
assert.throws(()=>M.update(a,{...row,available_to_model_ms:t+1}),/chronology/);
assert.throws(()=>M.update(a,{...row,matured_at_ms:t-1}),/chronology/);
assert.throws(()=>M.update(a,{...row,source_verified:false}),/chronology/);
assert.throws(()=>M.update(a,{...row,features:{...fs(),spread_bps:100000}}),/Feature/);
assert.throws(()=>M.update(a,row,{lr:5}),/Unsafe/);
assert.throws(()=>M.create('imaginary'),/Unknown/);
console.log('MAHORAGA B eight chronological paper-only specialist learners PASS');
