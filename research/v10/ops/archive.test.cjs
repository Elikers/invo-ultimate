'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const S=require('./archive.cjs'),F=require('../forward/forward.cjs'),R=require('../forward/registration.json');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mahoraga-v104-'));
const run='44284652222',t=F.START-300000;
const receipt={schema:'mahoraga-v103-capture-receipt-v1',run_id:run,
  registration_sha256:F.hash(R),started_at_ms:t,ended_at_ms:t+20000,
  observations:[],gaps:R.markets.map(m=>F.gap(m,t+20000,'REGISTRATION_NOT_ACTIVE')),
  live_orders:false,training_eligible:false,independent_external_attestation:false};
try{
 const b=JSON.stringify(receipt,null,2)+'\n';
 fs.writeFileSync(path.join(dir,'capture-receipt.json'),b);
 fs.writeFileSync(path.join(dir,'capture-receipt.sha256'),S.digest(b)+'  capture-receipt.json\n');
 fs.writeFileSync(path.join(dir,'selected-public-frames.json'),'{}\n');
 const manifest=S.write(dir,run);
 assert.equal(manifest.observed,0);
 assert.equal(manifest.gaps,3);
 assert.equal(manifest.external_backup_verified,false);
 assert.ok(S.verifyArchive(manifest,dir));
 assert.throws(()=>S.write(dir,run),/overwrite/);
 assert.throws(()=>S.stage(dir,'44284652223'),/run ID mismatch/);
 fs.appendFileSync(path.join(dir,'selected-public-frames.json'),'tampered');
 assert.throws(()=>S.verifyArchive(manifest,dir),/tampered/);
}finally{fs.rmSync(dir,{recursive:true,force:true})}
console.log('MAHORAGA v10.4 archive provenance, no overwrite, missing-future, tamper and no external attestation PASS');
