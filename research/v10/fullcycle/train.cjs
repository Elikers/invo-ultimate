'use strict';
// Stage 9: incremental TRAIN-only candidate updates from the multi-engine journal.
// Never alters champion, website or the source ledger. Nothing auto-promoted.
const M=require('../learners/specialists.cjs'),REG=require('../learners/registration.json');
const TRAIN=require('../autolearn/training-registration.json'),S=require('./multi-ledger.cjs');
const T=require('../next/temporal.cjs'),crypto=require('node:crypto');
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function init(){
 return {schema:'invo-v10-multi-challengers-1',
  models:Object.fromEntries(REG.experts.map(x=>[x,{champion:M.create(x,'v10-prospective-immutable'),
    challenger:M.create(x,'v10-prospective-immutable'),processed:[]}])),
  last_checkpoint:null,training_only:true,promotion_authorized:false};
}
function train(state,log,now){
 if(state?.schema!=='invo-v10-multi-challengers-1'||!Number.isSafeInteger(now))throw Error('Untrusted training state');
 S.verify(log);let next=structuredClone(state),accepted=0,blocked=0,duplicate=0;
 const obs=new Map(log.filter(x=>x.item.type==='OBSERVATION').map(x=>[x.item.id,x.item]));
 const rows=log.filter(x=>x.item.type==='ENGINE_OUTCOME').map(x=>x.item);
 const begin=Date.parse(TRAIN.train_start_utc),end=Date.parse(TRAIN.train_end_exclusive_utc);
 rows.sort((a,b)=>a.recorded_at_ms-b.recorded_at_ms||a.id.localeCompare(b.id));
 for(const x of rows){
  const m=next.models[x.engine],o=obs.get(x.observation_id);
  if(!m||!o||m.processed.includes(x.id)){duplicate++;continue}
  const d=o.decisions.find(d=>d.engine===x.engine);
  if(x.result!=='PAPER'||d?.side==='NONE'||!o.training_feature_snapshot||
   o.training_feature_sha256!==digest(o.training_feature_snapshot)||
   o.predicted_at_ms<begin||o.predicted_at_ms>=end||
   x.recorded_at_ms>=end||x.recorded_at_ms>now||
   x.source_exit_received_ms>now||
   x.cost_provenance!=='ASSUMED_NOT_EXECUTED'||x.assumed_net_pct===undefined||
   !Number.isFinite(x.gross_paper_pct)||!Number.isFinite(x.total_assumed_cost_bps)){
   blocked++;continue;
  }
  let feature;
  try{feature=T.normalize(o.training_feature_snapshot)}catch{blocked++;continue}
  if(feature.mask.some(v=>v!==1)){blocked++;continue}
  // No learning if a settled result has the same/older maturity timestamp.
  if(x.recorded_at_ms<=m.challenger.last_matured_ms){blocked++;continue}
  const row={expert:x.engine,purpose:'TRAIN',label_source:'MATURED_FROZEN_PAPER_SIM',
   predicted_at_ms:o.predicted_at_ms,matured_at_ms:x.recorded_at_ms,
   available_to_model_ms:o.available_to_model_ms,
   win_label:x.gross_paper_pct-x.total_assumed_cost_bps/100>0?1:0,
   features:feature.values,registration_locked:true,source_verified:true};
  m.challenger=M.update(m.challenger,row).next;
  m.processed.push(x.id);accepted++;
 }
 // Conservative bound: no implicit pruning of processed IDs; requires manual archival.
 for(const m of Object.values(next.models))
  if(m.processed.length>50000)throw Error('Research model ID capacity requires audited archive');
 next.last_checkpoint=digest(next.models);
 return {next,report:{schema:'invo-v10-multi-auto-train-1',
  new_challenger_updates:accepted,blocked_or_incomplete:blocked,duplicate,
  checkpoint_sha256:next.last_checkpoint,
  champion_unchanged:REG.experts.every(id=>
    M.fingerprint(state.models[id].champion)===M.fingerprint(next.models[id].champion)),
  research_only:true,orders_enabled:false,automatic_promotion:false,
  independent_profitability_verified:false}};
}
module.exports={init,train,digest};
