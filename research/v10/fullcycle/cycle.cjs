'use strict';
// Fully bounded one-shot RESEARCH cycle for a future opt-in scheduled host.
// No WebSocket daemon, trade endpoint, wallet, model promotion or website publishing.
const fs=require('node:fs'),path=require('node:path');
const P=require('./pipeline.cjs'),L=require('./multi-ledger.cjs'),PAPER=require('./paper.cjs');
const TRAIN=require('./scheduled-step.cjs'),E=require('./evaluation.cjs');
function settle(root,now){
 const source=P.loadCapture(root),file=path.join(root,'multi-shadow.jsonl');
 let journal=P.readLedger(file),written=0,missing=0,noTrades=0,assumedPaper=0;
 const labels=new Set(journal.filter(x=>x.item.type==='ENGINE_OUTCOME').map(x=>
  x.item.observation_id+'|'+x.item.engine));
 const observations=journal.filter(x=>x.item.type==='OBSERVATION').map(x=>x.item);
 for(const o of observations){
  if(o.mature_after_ms>now)continue;
  const b=source.events.filter(e=>e.market===o.market&&e.kind==='BOOK_SNAPSHOT'&&
   e.quality.valid===true&&e.timestamps.available_to_model_ms<=now&&
   now-e.timestamps.available_to_model_ms<=3000)
   .sort((a,b)=>a.timestamps.available_to_model_ms-b.timestamps.available_to_model_ms).at(-1);
  const quote=b?{bid:b.payload.best_bid,ask:b.payload.best_ask,
   source_received_ms:b.timestamps.available_to_model_ms,
   source_sha256:b.source.raw_sha256}:null;
  for(const decision of o.decisions){
   const id=o.id+'|'+decision.engine;if(labels.has(id))continue;
   const label=PAPER.label(o,decision.engine,quote,now);
   journal=L.persist(file,journal,label,now);
   labels.add(id);written++;
   if(label.result==='NO_TRADE')noTrades++;
   if(label.result==='MISSING_DATA')missing++;
   if(label.result==='PAPER')assumedPaper++;
  }
 }
 return {written,missing,noTrades,assumedPaper,
  fills_verified:0,training_data_independently_verified:false};
}
function runOnce(root,now=Date.now()){
 if(!path.isAbsolute(root)||!Number.isSafeInteger(now))throw Error('Absolute research root and valid clock required');
 fs.mkdirSync(root,{recursive:true,mode:0o700});
 const lock=path.join(root,'.fullcycle-cycle.lock');
 let fd;try{fd=fs.openSync(lock,'wx',0o600)}
 catch{throw Error('Research cycle already active or stale lock: manual inspection required')}
 try{
  // No authenticated model inference wiring = 10 explicit NONEs for each fresh market observation.
  const observations={};
  for(const market of ['BTC','ETH','SOL']){
   observations[market]=P.observeMarket(root,market,now);
  }
  const outcomes=settle(root,now);
  const learning=TRAIN.trainingStep(root,now);
  const evaluation=E.summarize(P.readLedger(path.join(root,'multi-shadow.jsonl')),now);
  return {schema:'invo-v10-research-cycle-1',at_ms:now,observations,outcomes,learning,
   evaluation_status:evaluation.evaluation_status,
   authentic_model_predictions_connected:false,
   no_orders:true,production_untouched:true,
   always_on_runtime_not_deployed:true,independent_profitability_verified:false};
 }finally{fs.closeSync(fd);fs.unlinkSync(lock)}
}
module.exports={settle,runOnce};
