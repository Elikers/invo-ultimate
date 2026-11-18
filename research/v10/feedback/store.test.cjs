'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const S=require('./store.cjs'),F=require('./feedback.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'mahoraga-journal-')),file=path.join(root,'trial.jsonl');
try{
 const t=Date.parse('2026-11-19T00:00:00Z');
 const item={type:'DECISION',id:'decision-001',expert:'fusion',side:'LONG',
 model_sha256:'f'.repeat(64),predicted_at_ms:t,feature_available_ms:t,
 mature_after_ms:t+900000,recorded_at_ms:t+10,registration_id:'registered-test',
 production_authorized:false};
 const first=S.append(file,item);assert.equal(first.entries,1);
 assert.equal(first.ready_for_training,false);
 assert.equal(S.read(file)[0].item.id,'decision-001');
 const second=S.append(file,{type:'OUTCOME',id:'decision-001',recorded_at_ms:t+900001,
 gross_paper_pct:-1,assumed_cost_bps:16,paper_exit_rule:'frozen-test',execution_fill_verified:false});
 assert.equal(second.entries,2);
 assert.equal(F.verify(S.read(file)).verified,true);
 assert.throws(()=>S.append(file,item),/duplicate/);
 fs.appendFileSync(file,'TRUNCATED');
 assert.throws(()=>S.read(file),/Incomplete journal/);
 assert.throws(()=>S.append(file,{...item,id:'new-id-002'}),/Incomplete journal/);
}finally{fs.rmSync(root,{recursive:true,force:true});}
console.log('MAHORAGA durable local WAL: append fsync, reload, integrity, fail-closed torn-write PASS');
