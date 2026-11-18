'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const C=require('../runtime/controller.cjs');
const t=Date.parse('2026-11-19T00:05:00Z');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'multi-research-'));
try{
 const run={};
 for(const market of ['BTC','ETH','SOL']){
  const s=C.controller(path.join(root,market),{runId:'offline-'+market,market,now:()=>t+1000});
  s.onConnected();
  const m=JSON.stringify({channel:'l2Book',data:{coin:market,time:t,
   levels:[[{px:'100',sz:'2'}],[{px:'101',sz:'3'}]]}});
  assert.equal(s.onMessage(m,t+1000,10).accepted,1);
  assert.equal(s.health().stored.accepted,1);
  run[market]=m;s.stop('research-test');
 }
 for(const market of ['BTC','ETH','SOL']){
  const s=C.controller(path.join(root,market),{runId:'offline-restart-'+market,market,now:()=>t+2000});
  s.onConnected();
  assert.equal(s.onMessage(run[market],t+2000,3).accepted,0);
  s.stop('test');
 }
 const s=C.controller(path.join(root,'ETH'),{runId:'negative-test',market:'ETH',now:()=>t+3000});
 s.onConnected();
 assert.equal(s.onMessage(run.BTC,t+3000,10).accepted,0);
 s.stop('test');
}finally{fs.rmSync(root,{recursive:true,force:true});}
console.log('MAHORAGA 01 three-market isolated capture, duplicate recovery and instrument quarantine PASS');
