'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {controller}=require('./controller.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'mahoraga-bounded-'));
const t=Date.parse('2026-11-19T00:02:00Z');let now=t+100;
const book=(stamp)=>JSON.stringify({channel:'l2Book',data:{coin:'BTC',time:stamp,levels:[
 [{px:'100',sz:'2'}],[{px:'101',sz:'3'}]]}});
try{
 const a=controller(root,{runId:'bounded-trial-001',now:()=>now,maxFrames:50,maxSeconds:100});
 assert.throws(()=>controller(root,{runId:'bounded-trial-002',now:()=>now}),/locked/);
 assert.equal(a.onConnected(),0);
 assert.equal(a.onMessage(book(t),now,100).accepted,1);
 assert.equal(a.onDisconnect('simulate-loss'),1);
 assert.throws(()=>a.onMessage(book(t+1000),now+50,120),/active socket/);
 now=t+1100;assert.equal(a.onConnected(),1);
 assert.equal(a.onMessage(book(t+1000),now,130).accepted,1);
 assert.equal(a.health().stored.accepted,2);
 a.stop('bounded');
 assert.equal(fs.existsSync(path.join(root,'.single-writer.lock')),false);
 const b=controller(root,{runId:'bounded-trial-003',now:()=>now+500});
 assert.equal(b.onConnected(),2);
 assert.equal(b.onMessage(book(t+1000),now+500,3).accepted,0); // duplicate across restart
 const h=b.stop('done');assert.equal(h.orders_enabled,false);
 assert.equal(h.durable_external_storage_verified,false);
 fs.appendFileSync(path.join(root,'connection-health.jsonl'),'{torn');
 assert.throws(()=>controller(root,{runId:'bounded-trial-004',now:()=>now+700}),/Torn append/);
}finally{fs.rmSync(root,{recursive:true,force:true});}
console.log('MAHORAGA connection epochs, single writer, restart dedup and fail-closed journal PASS');
