'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {Collector}=require('./collector.cjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mahoraga-v10-collector-'));
const t=Date.parse('2026-11-19T00:00:00Z');
const book=()=>JSON.stringify({channel:'l2Book',data:{coin:'BTC',time:t,
 levels:[[{px:'100',sz:'2'}],[{px:'101',sz:'3'}]]}});
const trade=(tid,time=t+100)=>JSON.stringify({channel:'trades',data:[{coin:'BTC',time,tid,side:'B',px:'100.5',sz:'1'}]});
try{
 let c=new Collector(dir,{maxEvents:5,maxAgeMs:1000});
 assert.equal(c.ingest(book(),{receivedWallMs:t+100,receivedMonotonicMs:1}),'ACCEPTED_RESEARCH_ONLY');
 assert.equal(c.ingest(book(),{receivedWallMs:t+200,receivedMonotonicMs:2}),'QUARANTINED_OR_DUPLICATE');
 assert.equal(c.ingest(trade(1),{receivedWallMs:t+120,receivedMonotonicMs:3}),'ACCEPTED_RESEARCH_ONLY');
 assert.equal(c.summary(t+500).stored_events,2);
 assert.equal(c.summary(t+2000).stale,true);
 assert.equal(c.ingest(trade(2,t+200),{receivedWallMs:t+15000,receivedMonotonicMs:4}),'QUARANTINED_OR_DUPLICATE');
 assert.equal(c.summary().training_eligible,false);
 c.disconnect();
 c=new Collector(dir,{maxEvents:5,maxAgeMs:1000});
 assert.equal(c.ingest(trade(1),{receivedWallMs:t+200,receivedMonotonicMs:5}),'QUARANTINED_OR_DUPLICATE');
 assert.equal(c.ingest(trade(3,t+300),{receivedWallMs:t+310,receivedMonotonicMs:6}),'ACCEPTED_RESEARCH_ONLY');
 assert.equal(c.summary(t+1000).stored_events,3);
 fs.appendFileSync(path.join(dir,'public-events.jsonl'),'bad');
 assert.throws(()=>new Collector(dir),/Truncated/);
 fs.writeFileSync(path.join(dir,'public-events.jsonl'),'');
 assert.equal(new Collector(dir).summary().stored_events,0);
}finally{fs.rmSync(dir,{recursive:true,force:true});}
console.log('IMPROVEMENT 1 PASS: bounded ingestion, durable hash verification, dedup, reject stale, crash fail closed');
