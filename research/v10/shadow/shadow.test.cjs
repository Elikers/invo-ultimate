'use strict';
const assert=require('node:assert/strict'),S=require('./shadow.cjs'),R=require('./registration.json');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const t=Date.parse('2026-11-19T00:05:00Z'),h='a'.repeat(64);
const observation={id:'btc-20261119-001',type:'OBSERVATION',market:'BTC',venue:'hyperliquid',
 predicted_at_ms:t,captured_at_ms:t+5,available_to_model_ms:t-10,
 mature_after_ms:t+3600000,input_sha256:h,registration_sha256:S.hash(R),
 decisions:[...R.specialists,R.supervisor,'baseline'].map(engine=>({
 engine,side:'NONE',version_sha256:h,predicted_at_ms:t})),research_only:true,live_orders_allowed:false};
const x=S.append([],observation,t+5);
assert.equal(S.check(x).entries,1);
assert.throws(()=>S.append([],observation,t-500),/backfilled/);
assert.throws(()=>S.append([],{...observation,decisions:observation.decisions.slice(1)},t+5),/backfilled/);
assert.throws(()=>S.append([],{...observation,available_to_model_ms:t+1},t+5),/backfilled/);
const outcome={id:'outcome-btc-001',type:'OUTCOME',observation_id:observation.id,recorded_at_ms:t+3600001,
 label_type:'NO_TRADE',live_fill_verified:false,training_eligible:false};
assert.throws(()=>S.append(x,outcome,t+100),/Premature/);
const y=S.append(x,outcome,t+3600002);
assert.equal(S.check(y).entries,2);
assert.throws(()=>S.append(y,{...outcome,id:'outcome-2'},t+3600003),/Double-labeled/);
const tampered=structuredClone(y);tampered[0].item.market='ETH';
assert.throws(()=>S.check(tampered),/Tampered/);
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mahoraga-shadow-'));try{
 const file=path.join(dir,'shadow.jsonl');S.write(file,[],observation,t+10);
 assert.throws(()=>S.write(file,[],outcome,t+3600002),/Concurrent/);
 S.write(file,x,outcome,t+3600002);
 assert.equal(fs.readFileSync(file,'utf8').trim().split('\n').length,2);
}finally{fs.rmSync(dir,{recursive:true,force:true});}
console.log('MAHORAGA prospective shadow frame, abstention, no-lookahead, matured-only, tamper and single-writer guard PASS');
