'use strict';
// Parallel-outcome research ledger: one full outcome vector for each immutable observation.
// No single-engine overwrite, no unrestricted promotion or learning.
const crypto=require('node:crypto'),SR=require('../shadow/registration.json');
const SH=require('../shadow/shadow.cjs'),P=require('./paper.cjs');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function append(ledger,item,now){
 if(!Array.isArray(ledger)||!item||!Number.isSafeInteger(now))throw Error('Invalid journal');
 const previous=ledger.length?ledger.at(-1).sha256:'GENESIS';
 if(item.type==='OBSERVATION'){
  SH.verifyFrame(item,now);
  if(ledger.some(x=>x.item.type==='OBSERVATION'&&x.item.id===item.id))throw Error('Duplicate observation');
 }else if(item.type==='MULTI_OUTCOME'){
  const obs=ledger.find(x=>x.item.type==='OBSERVATION'&&x.item.id===item.observation_id)?.item;
  if(!obs||item.schema!=='invo-v10-multi-engine-paper-label-1'||
   item.observation_sha256!==hash(obs)||item.recorded_at_ms>now||
   item.recorded_at_ms<obs.mature_after_ms||
   ledger.some(x=>x.item.type==='MULTI_OUTCOME'&&x.item.observation_id===item.observation_id))
   throw Error('Orphaned/early/duplicated outcome');
  const expected=[...SR.specialists,SR.supervisor,'baseline'];
  if(!Array.isArray(item.labels)||item.labels.length!==expected.length)throw Error('Missing engine labels');
  for(const engine of expected){
   const a=item.labels.filter(x=>x.engine===engine);
   const frozen=obs.decisions.find(x=>x.engine===engine);
   if(a.length!==1||!frozen||a[0].model_version_sha256!==frozen.version_sha256||
    a[0].side!==frozen.side||
    a[0].actual_exchange_fill!==false||
    (frozen.side==='NONE'&&a[0].net_paper_pct!==null)||
    (frozen.side!=='NONE'&&!Number.isFinite(a[0].net_paper_pct)))
    throw Error('Unmatched model label');
  }
  if(item.training_approved!==false||item.live_orders!==false)throw Error('Unsafe multi-outcome promotion');
 }else throw Error('Unsupported journal event');
 const at=item.type==='OBSERVATION'?item.captured_at_ms:item.recorded_at_ms;
 const last=ledger.length?(ledger.at(-1).item.type==='OBSERVATION'?
  ledger.at(-1).item.captured_at_ms:ledger.at(-1).item.recorded_at_ms):0;
 if(at<last)throw Error('Nonchronological append');
 const e={previous_sha256:previous,item:structuredClone(item)};e.sha256=hash(e);
 return [...ledger,e];
}
function verify(ledger){
 let seen=[],prev='GENESIS';
 for(const e of ledger){
  if(e.previous_sha256!==prev||e.sha256!==hash({previous_sha256:prev,item:e.item}))
   throw Error('Broken or rewritten multi-outcome journal');
  seen=append(seen,e.item,e.item.type==='OBSERVATION'?e.item.captured_at_ms:e.item.recorded_at_ms);
  if(seen.at(-1).sha256!==e.sha256)throw Error('Journal replay mismatch');
  prev=e.sha256;
 }
 return {events:seen.length,verified:true,external_time_anchor_verified:false};
}
function candidateTrainingRow(observation,outcome,expert,features,trainRegistrationHash){
 if(!SR.specialists.includes(expert)||outcome.observation_id!==observation.id||
 outcome.observation_sha256!==hash(observation))throw Error('Unmatched training candidate');
 const label=outcome.labels.find(x=>x.engine===expert);
 if(!label||label.side==='NONE')return null;
 return {observation_id:observation.id,market:observation.market,
  training_registration_sha256:trainRegistrationHash,
  train_split:'UNREVIEWED',holdout:true,
  paper_rule_registered:false,source_audited:false,outcome_audited:false,
  cost_provenance:'ASSUMED_PAPER',predicted_at_ms:observation.predicted_at_ms,
  matured_at_ms:observation.mature_after_ms,recorded_outcome_ms:outcome.recorded_at_ms,
  model_version_sha256:label.model_version_sha256,input_sha256:observation.input_sha256,
  gross_paper_pct:label.gross_paper_pct,assumed_cost_bps:label.assumed_cost_bps,
  features,feature_snapshot_sha256:hash(features),
  external_independent_audit_missing:true,automatic_training_allowed:false};
}
module.exports={append,verify,candidateTrainingRow,hash};
