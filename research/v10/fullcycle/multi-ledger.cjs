'use strict';
// Stage 6: independent multi-engine forward paper outcome ledger.
// Each observation supports independent engine outcomes; no-trades are explicit.
// It is separate from older single-outcome shadow format; no implicit conversion.
const S=require('../shadow/shadow.cjs'),R=require('../shadow/registration.json');
const crypto=require('node:crypto'),fs=require('node:fs');
const engines=new Set([...R.specialists,R.supervisor,'baseline']);
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function fail(s){throw Error(s)}
function verify(log){
 if(!Array.isArray(log))fail('Invalid ledger');
 let previous='GENESIS',last=0;
 const observations=new Map(),labels=new Set();
 for(const e of log){
  if(!e||e.prev!==previous||hash({prev:e.prev,item:e.item})!==e.sha256)
   fail('Tampered or reordered multi-engine journal');
  const x=e.item,t=x.type==='OBSERVATION'?x.captured_at_ms:x.recorded_at_ms;
  if(!Number.isSafeInteger(t)||t<last)fail('Nonchronological durable journal');
  if(x.type==='OBSERVATION'){
   S.verifyFrame(x,t);
   if(observations.has(x.id))fail('Duplicate observation');
   observations.set(x.id,x);
  }else if(x.type==='ENGINE_OUTCOME'){
   const o=observations.get(x.observation_id);
   if(!o||!engines.has(x.engine)||!o.decisions.find(d=>d.engine===x.engine)||
    labels.has(x.observation_id+'|'+x.engine)||!Number.isSafeInteger(x.recorded_at_ms)||
    x.recorded_at_ms<o.mature_after_ms||
    x.recorded_at_ms<x.source_exit_received_ms||
    !Number.isSafeInteger(x.source_exit_received_ms)||x.source_exit_received_ms<o.mature_after_ms||
    !['PAPER','NO_TRADE','MISSING_DATA'].includes(x.result)||
    x.execution_fill_verified!==false||x.training_eligible!==false||
    x.research_only!==true)
    fail('Invalid, duplicate or premature engine outcome');
   const side=o.decisions.find(d=>d.engine===x.engine).side;
   if((side==='NONE'&&x.result==='PAPER')||
      (side!=='NONE'&&x.result==='NO_TRADE'))fail('Invalid no-trade outcome');
   if(x.result==='PAPER'&&(
     !Number.isFinite(x.gross_paper_pct)||!Number.isFinite(x.total_assumed_cost_bps)||
     x.total_assumed_cost_bps<0||x.total_assumed_cost_bps>500||
     typeof x.exit_rule_sha256!=='string'||!/^[a-f0-9]{64}$/.test(x.exit_rule_sha256)||
     x.cost_provenance!=='ASSUMED_NOT_EXECUTED'))fail('Invalid cost or exit convention');
   labels.add(x.observation_id+'|'+x.engine);
  }else if(x.type==='CAPTURE_GAP'){
   if(x.research_only!==true||typeof x.reason!=='string'||x.reason.length<4)
    fail('Invalid gap report');
  }else fail('Unknown durable record type');
  last=t;previous=e.sha256;
 }
 return {verified:true,entries:log.length,observations:observations.size,
  engine_outcomes:labels.size,ready_to_trade:false,profits_validated:false};
}
function add(log,item,now){
 verify(log);
 if(!Number.isSafeInteger(now)||item?.type==='OBSERVATION'&&item.captured_at_ms>now||
 item?.type==='ENGINE_OUTCOME'&&item.recorded_at_ms>now)fail('Future or invalid append');
 const next={prev:log.length?log.at(-1).sha256:'GENESIS',item:structuredClone(item)};
 next.sha256=hash(next);
 const out=[...log,next];
 verify(out);
 return out;
}
function persist(file,log,item,now){
 if(typeof file!=='string'||!file.endsWith('.jsonl'))fail('Journal path invalid');
 const bytes=fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';
 if(bytes&&!bytes.endsWith('\n'))fail('Incomplete journal requires quarantine');
 const current=bytes.trim()?bytes.trim().split('\n').map(JSON.parse):[];
 if(hash(current)!==hash(log))fail('Concurrent writer or changed source');
 const next=add(log,item,now),entry=next.at(-1);
 const fd=fs.openSync(file,'a',0o600);
 try{const buf=Buffer.from(JSON.stringify(entry)+'\n');
 if(fs.writeSync(fd,buf)!==buf.length)fail('Partial durable append');
 fs.fsyncSync(fd)}finally{fs.closeSync(fd)}
 return next;
}
module.exports={add,verify,persist,hash};
