'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const H=require('./store.cjs'),A=require('./loop.cjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mahoraga-learning-'));
try{
 const first=H.readState(dir,'fusion');
 assert.equal(first.challenger.updates,0);
 assert.equal(first.champion.updates,0);
 assert.throws(()=>H.readState(dir,'not-an-engine'),/Unregistered/);
 const file=path.join(dir,'journal.jsonl'),rows=path.join(dir,'rows.json');
 fs.writeFileSync(file,'');
 fs.writeFileSync(rows,'[]');
 const report=H.step(dir,'fusion',file,rows,Date.parse('2026-11-20T00:00:00Z'));
 assert.equal(report.accepted_for_training,0);
 assert.equal(report.checkpoint_written,false);
 assert.equal(report.auto_promotion,false);
 assert.equal(fs.existsSync(path.join(dir,'fusion-challenger.json')),false);
 fs.writeFileSync(file,'CORRUPTED');
 assert.throws(()=>H.step(dir,'fusion',file,rows,Date.now()),/truncated/);
 assert.equal(fs.existsSync(path.join(dir,'.learning-writer.lock')),false);
}finally{fs.rmSync(dir,{recursive:true,force:true});}
console.log('MAHORAGA local idempotent checkpoint IO, empty safe no-op, corrupted journal fail-closed PASS');
