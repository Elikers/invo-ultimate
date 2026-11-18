'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const C=require('./capture.cjs');const root=fs.mkdtempSync(path.join(os.tmpdir(),'mahoraga-v10-'));
try{
 const t=1795000000000,book=JSON.stringify({channel:'l2Book',data:{coin:'BTC',time:t,levels:[
  [{px:'100',sz:'1'}],[{px:'101',sz:'1'}]]}});
 const x=C.open(root,'test-run-01');
 assert.equal(x.ingest(book,t+10,1).accepted,1);
 assert.equal(x.ingest(book,t+20,2).accepted,0);
 assert.equal(x.ingest('{bad',t+30,3).accepted,0);
 assert.equal(x.health().accepted,1);
 const restarted=C.open(root,'test-run-01');
 assert.equal(restarted.health().frames,3);
 assert.equal(restarted.ingest(book,t+40,4).accepted,0);
 assert.equal(C.read(restarted.files.events)[0].use.training_eligible,false);
 fs.appendFileSync(restarted.files.raw,'broken');
 assert.throws(()=>C.open(root,'test-run-01'),/Torn append/);
}finally{fs.rmSync(root,{recursive:true,force:true});}
console.log('GATE 1 persistent raw hash, restart replay, dedup, quarantine, torn append PASS');
