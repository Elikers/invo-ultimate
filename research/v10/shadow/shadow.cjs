'use strict';
/* Future-only MAHORAGA shadow journal. A frame is a pre-outcome observation of eight
 * frozen specialists, supervisor and baseline. No trading, no automatic model updates.
 */
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const R=require('./registration.json');
const hash=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const ids=[...R.specialists,R.supervisor,'baseline'];
const validHash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const fail=m=>{throw Error(m)};
function verifyFrame(x,now){
 if(!x||x.type!=='OBSERVATION'||!R.markets.includes(x.market)||x.venue!==R.venue||
 !Number.isSafeInteger(now)||now<=0||!Number.isSafeInteger(x.predicted_at_ms)||
 !Number.isSafeInteger(x.captured_at_ms)||x.captured_at_ms< Date.parse(R.start_utc)||
 x.predicted_at_ms<Date.parse(R.start_utc)||x.captured_at_ms<x.predicted_at_ms||
 x.captured_at_ms>now||now-x.captured_at_ms>120000||
 !Number.isSafeInteger(x.available_to_model_ms)||x.available_to_model_ms>x.predicted_at_ms||
 !Number.isSafeInteger(x.mature_after_ms)||x.mature_after_ms<=x.predicted_at_ms||
 !validHash(x.input_sha256)||!validHash(x.registration_sha256)||
 x.registration_sha256!==hash(R)||!Array.isArray(x.decisions)||x.decisions.length!==ids.length||
 x.research_only!==true||x.live_orders_allowed!==false)fail('Invalid or backfilled forward observation');
 const set=new Set();
 for(const d of x.decisions){
  if(!ids.includes(d.engine)||set.has(d.engine)||!['LONG','SHORT','NONE'].includes(d.side)||
   !validHash(d.version_sha256)||!Number.isSafeInteger(d.predicted_at_ms)||
   d.predicted_at_ms!==x.predicted_at_ms)fail('Invalid or missing frozen engine decision');
  set.add(d.engine);
 }
 if(set.size!==ids.length)fail('Missing expert, supervisor or baseline');
}
function verifyOutcome(x,observations,now){
 if(!x||x.type!=='OUTCOME'||!Number.isSafeInteger(now)||x.recorded_at_ms>now||
 !Number.isSafeInteger(x.recorded_at_ms)||typeof x.observation_id!=='string')fail('Invalid outcome');
 const obs=observations.find(o=>o.type==='OBSERVATION'&&o.id===x.observation_id);
 if(!obs||now<obs.mature_after_ms||x.recorded_at_ms<obs.mature_after_ms||
 !['PAPER_SIMULATED','NO_TRADE'].includes(x.label_type)||
 (x.label_type==='PAPER_SIMULATED'&&(!Number.isFinite(x.gross_paper_pct)||!
 Number.isFinite(x.assumed_cost_bps)||x.assumed_cost_bps<0))||
 x.live_fill_verified!==false||x.training_eligible!==false)fail('Premature, unsupported or promoted shadow outcome');
}
function append(existing,item,now){
 if(!Array.isArray(existing)||!item||typeof item.id!=='string'||item.id.length<8||
 existing.some(e=>e.item.type===item.type&&e.item.id===item.id))fail('Duplicate/invalid journal item');
 if(item.type==='OBSERVATION')verifyFrame(item,now);
 else if(item.type==='OUTCOME'){
  const prior=existing.map(e=>e.item);
  if(prior.some(e=>e.type==='OUTCOME'&&e.observation_id===item.observation_id))fail('Double-labeled observation');
  verifyOutcome(item,prior,now);
 }else fail('Unknown shadow record');
 const prev=existing.length?existing.at(-1).sha256:'GENESIS';
 const record={previous_sha256:prev,item:structuredClone(item)};
 record.sha256=hash(record);
 return [...existing,record];
}
function check(journal){
 if(!Array.isArray(journal))fail('Invalid journal');
 let prev='GENESIS',lastMs=0;
 for(const r of journal){
  if(r?.previous_sha256!==prev||r.sha256!==hash({previous_sha256:r.previous_sha256,item:r.item}))
   fail('Tampered journal hash chain');
  const t=r.item.type==='OBSERVATION'?r.item.captured_at_ms:r.item.recorded_at_ms;
  if(!Number.isSafeInteger(t)||t<lastMs)fail('Disordered append log');
  prev=r.sha256;lastMs=t;
 }
 return {entries:journal.length,hash:prev,verified:true,forward_profitability_validated:false};
}
function write(file,existing,item,now){
 if(typeof file!=='string'||!file.endsWith('.jsonl'))fail('Journal filename');
 if(fs.existsSync(file)){
  const b=fs.readFileSync(file,'utf8');
  if(b&&!b.endsWith('\n'))fail('Torn journal tail');
  const onDisk=b.trim()?b.trim().split('\n').map(JSON.parse):[];
  if(JSON.stringify(onDisk)!==JSON.stringify(existing))fail('Concurrent or changed writer: refuse');
  check(onDisk);
 }else if(existing.length)fail('Missing previous journal');
 const next=append(existing,item,now);
 const fd=fs.openSync(file,'a',0o600);
 try{fs.writeSync(fd,JSON.stringify(next.at(-1))+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 check(next);
 return next;
}
module.exports={hash,append,check,write,verifyFrame,verifyOutcome};
