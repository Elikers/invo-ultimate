'use strict';
// Stage 5: a separate, optional MAHORAGA research meta challenger.
// It can train ONLY from frozen, fully matched eight-expert votes and settled
// Mahoraga paper outcomes in the registered TRAIN window. No automatic promotion.
const META=require('../next/meta.cjs'),REG=require('../learners/registration.json'),
 TRAIN=require('../autolearn/training-registration.json'),L=require('./multi-ledger.cjs');
const crypto=require('node:crypto');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function init(){
 return {schema:'invo-v10-meta-research-challenger-1',
  champion:META.init('v10-reg-meta-research'),challenger:META.init('v10-reg-meta-research'),
  processed:[],training_only:true,production_eligible:false};
}
function train(state,log,now){
 if(state?.schema!=='invo-v10-meta-research-challenger-1'||!Number.isSafeInteger(now))
 throw Error('Invalid meta-learning state');
 L.verify(log);
 const obs=new Map(log.filter(e=>e.item.type==='OBSERVATION').map(e=>[e.item.id,e.item]));
 const labels=log.filter(e=>e.item.type==='ENGINE_OUTCOME'&&e.item.engine==='mahoraga').map(e=>e.item)
 .sort((a,b)=>a.recorded_at_ms-b.recorded_at_ms||a.id.localeCompare(b.id));
 const next=structuredClone(state);let used=0,blocked=0;
 const start=Date.parse(TRAIN.train_start_utc),end=Date.parse(TRAIN.train_end_exclusive_utc);
 for(const result of labels){
  if(next.processed.includes(result.id))continue;
  const o=obs.get(result.observation_id);
  if(!o||o.predicted_at_ms<start||o.predicted_at_ms>=end||
   result.recorded_at_ms>=end||result.recorded_at_ms>now||
   result.result!=='PAPER'||!Number.isFinite(result.gross_paper_pct)||
   !Number.isFinite(result.total_assumed_cost_bps)||result.cost_provenance!=='ASSUMED_NOT_EXECUTED'||
   result.recorded_at_ms<=next.challenger.last_matured_ms){blocked++;continue}
  const e=REG.experts.map(id=>o.decisions.find(x=>x.engine===id));
  if(e.length!==8||e.some(x=>!x||x.reason!=='FROZEN_RESEARCH_PREDICTION'||
    !Number.isFinite(x.probability)||!Number.isFinite(x.reliability)||
    x.predicted_at_ms!==o.predicted_at_ms)){blocked++;continue}
  const experts=e.map((x,i)=>({expert:REG.experts[i],side:x.side,
   probability:x.probability,reliability:x.reliability,
   predicted_at_ms:x.predicted_at_ms,model_frozen_before_prediction:true}));
  next.challenger=META.train(next.challenger,{experts,
   predicted_at_ms:o.predicted_at_ms,feature_available_ms:o.available_to_model_ms,
   matured_at_ms:result.recorded_at_ms,gross_paper_pct:result.gross_paper_pct,
   cost_bps:result.total_assumed_cost_bps,purpose:'TRAIN',split:'train',
   source_verified:true,label_source:'MATURED_FROZEN_PAPER_SIM',
   registration_locked:true,test_holdout:false});
  next.processed.push(result.id);used++;
 }
 if(next.processed.length>50000)throw Error('Meta archive required');
 return {next,report:{schema:'invo-v10-meta-challenger-step-1',
  new_updates:used,blocked_incomplete:blocked,train_only:true,
  champion_sha256:META.fingerprint(next.champion),
  challenger_sha256:META.fingerprint(next.challenger),
  activation:'BLOCKED',automatic_promotion:false,
  live_orders:false,actual_profit_verified:false}};
}
module.exports={init,train,hash};
