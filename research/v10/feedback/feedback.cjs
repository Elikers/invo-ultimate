'use strict';
// Research-only append-only hash-chained decision/outcome journal. No persistence backend or exchange integration.
const crypto=require('node:crypto'),R=require('../learners/registration.json');
const experts=new Set([...R.experts,'mahoraga']);
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const validSha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
function add(ledger,item){
 if(!Array.isArray(ledger)||!item||!Number.isSafeInteger(item.recorded_at_ms)||item.recorded_at_ms<=0)
 throw Error('Invalid journal timestamp');
 const prev=ledger.length?ledger.at(-1).hash:'GENESIS';
 if(ledger.length&&item.recorded_at_ms<ledger.at(-1).item.recorded_at_ms)
 throw Error('Append must be chronological');
 const prior=ledger.map(x=>x.item);
 if(item.type==='DECISION'){
  if(typeof item.id!=='string'||item.id.length<4||prior.some(x=>x.type==='DECISION'&&x.id===item.id)||
   !experts.has(item.expert)||!['LONG','SHORT','NONE'].includes(item.side)||!validSha(item.model_sha256)||
   !Number.isSafeInteger(item.predicted_at_ms)||item.predicted_at_ms>item.recorded_at_ms||
   !Number.isSafeInteger(item.feature_available_ms)||item.feature_available_ms>item.predicted_at_ms||
   !Number.isSafeInteger(item.mature_after_ms)||item.mature_after_ms<=item.predicted_at_ms||
   typeof item.registration_id!=='string'||item.registration_id.length<4||
   item.production_authorized!==false)throw Error('Invalid/retrospective/duplicate decision');
 }else if(item.type==='OUTCOME'){
  const d=prior.find(x=>x.type==='DECISION'&&x.id===item.id);
  if(!d||d.side==='NONE'||prior.some(x=>x.type==='OUTCOME'&&x.id===item.id)||
   item.recorded_at_ms<d.mature_after_ms||!Number.isFinite(item.gross_paper_pct)||
   !Number.isFinite(item.assumed_cost_bps)||item.assumed_cost_bps<0||
   typeof item.paper_exit_rule!=='string'||item.paper_exit_rule.length<4||
   item.execution_fill_verified!==false)throw Error('Outcome missing, premature, duplicated or falsely executed');
 }else throw Error('Only decision/outcome journal events permitted');
 const entry={previous_hash:prev,item:structuredClone(item)};
 entry.hash=sha(JSON.stringify(entry));
 return [...ledger,entry];
}
function verify(ledger){
 if(!Array.isArray(ledger))throw Error('Invalid ledger');
 let x=[];for(const e of ledger){
  const rebuild=add(x,e?.item);
  if(rebuild.at(-1).hash!==e.hash||rebuild.at(-1).previous_hash!==e.previous_hash)
   throw Error('Evidence tampering or broken hash chain');
  x=rebuild;
 }
 return {entries:ledger.length,verified:true,training_approved:false,profitability_claimed:false};
}
function trainingRows(ledger,cutoffMs){
 verify(ledger);
 if(!Number.isSafeInteger(cutoffMs))throw Error('Invalid cutoff');
 const decisions=new Map(ledger.filter(x=>x.item.type==='DECISION').map(x=>[x.item.id,x.item]));
 return ledger.filter(x=>x.item.type==='OUTCOME'&&x.item.recorded_at_ms<=cutoffMs)
  .map(x=>({decision:decisions.get(x.item.id),outcome:x.item,
   // Requires additional preregistered TRAIN-only split approval; never a training mandate.
   eligible_for_training:false,net_paper_pct:x.item.gross_paper_pct-x.item.assumed_cost_bps/100}));
}
module.exports={add,verify,trainingRows};
