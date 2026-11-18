'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const R=require('./registry.cjs'),M=require('../learners/specialists.cjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mah-reg-'));
try{
 const model=M.create('fusion'),proof={locked_stage:'EXPERT_TRAIN',dataset_sha256:'a'.repeat(64),
 independent_forward_validated:false,market:'BTCUSDT'};
 const p=R.save(dir,model,proof);
 assert.equal(p.production_eligible,false);
 assert.equal(R.load(dir,p.fingerprint).model.expert,'fusion');
 assert.equal(R.save(dir,model,proof).fingerprint,p.fingerprint);
 assert.throws(()=>R.save(dir,model,{...proof,independent_forward_validated:true}),/provenance/);
 const file=p.path;fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace('fusion','sweep'));
 assert.throws(()=>R.load(dir,p.fingerprint),/integrity/);
 assert.equal(R.compareResearchVersions(model,model).action,'HUMAN_REVIEW_ONLY_NO_AUTOMATIC_ROLLBACK_OR_PROMOTION');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
console.log('IMPROVEMENT 3 EXTRA PASS: immutable local model snapshots and tamper detection');
