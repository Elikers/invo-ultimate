'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const F=require('../forward/forward.cjs'),R=require('../forward/registration.json'),P=require('./persist.cjs'),L=require('./ledger.cjs');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mahoraga-ledger-test-'));
try{
 const input=path.join(tmp,'input'),out=path.join(tmp,'evidence');
 fs.mkdirSync(input);
 const now=F.START+10000;
 const receipt={schema:'mahoraga-v103-capture-receipt-v1',run_id:'12345678',
  registration_sha256:F.hash(R),live_orders:false,training_eligible:false,
  independent_external_attestation:false,observations:[],
  gaps:R.markets.map(x=>F.gap(x,now,'NO_FRESH_VALID_L2'))};
 const bytes=JSON.stringify(receipt,null,2)+'\n';
 fs.writeFileSync(path.join(input,'capture-receipt.json'),bytes);
 fs.writeFileSync(path.join(input,'capture-receipt.sha256'),F.hash(bytes)+'  capture-receipt.json\n');
 fs.writeFileSync(path.join(input,'selected-public-frames.json'),'{}\n');
 const a=P.persist(input,out,'12345678');
 assert.equal(a.entries,1);assert.equal(a.observations,0);
 assert(L.verify(JSON.parse(fs.readFileSync(path.join(out,'ledger.json'),'utf8'))));
 assert.throws(()=>P.persist(input,out,'12345678'),/Duplicate/);
 fs.writeFileSync(path.join(input,'capture-receipt.sha256'),'0'.repeat(64)+'  capture-receipt.json\n');
 assert.throws(()=>P.persist(input,out,'87654321'),/digest mismatch/);
 console.log('v10.8 git evidence staging: sealed receipt, raw bundle, digest and dup protection PASS');
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
