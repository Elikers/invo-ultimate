'use strict';
/* MAHORAGA v10 adaptive research TRAIN-only challenger.
 * No scheduled task, network, orders, account, website or model promotion.
 * Every label must follow an immutable recorded pre-outcome shadow observation.
 */
const crypto=require('node:crypto');
const M=require('../learners/specialists.cjs');
const S=require('../shadow/shadow.cjs');
const R=require('../shadow/registration.json');
const T=require('../next/temporal.cjs');
const G=require('../governance/governance.cjs');
const names=new Set(R.specialists);
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function fail(x){throw Error(x)}
function init(expert,registrationId='v10-shadow-challenger'){
 if(!names.has(expert))fail('Unregistered expert');
 return {schema:'invo-v10-auto-challenger-1',expert,registrationId,
  champion:M.create(expert,registrationId),challenger:M.create(expert,registrationId),
  processed_ids:[],last_training_outcome_ms:0,proposal_seq:0,
  no_production_write:true,training_source:'REGISTERED_SHADOW_PAPER_ONLY'};
}
function inspect(journal,trainingRecords,now,model){
 S.check(journal);
 if(!Number.isSafeInteger(now)||!Array.isArray(trainingRecords)||model?.schema!=='invo-v10-auto-challenger-1')fail('Invalid training inputs');
 if(trainingRecords.length>1000)fail('Batch capacity exceeded');
 const docs=journal.map(x=>x.item);
 const observations=new Map(docs.filter(x=>x.type==='OBSERVATION').map(x=>[x.id,x]));
 const outcomes=new Map(docs.filter(x=>x.type==='OUTCOME').map(x=>[x.observation_id,x]));
 const distinct=new Set(),eligible=[],rejected=[];
 for(const row of trainingRecords){
  const id=row?.observation_id;
  if(typeof id!=='string'||distinct.has(id))
   fail('Duplicate observation within training batch');
  distinct.add(id);
  if(model.processed_ids.includes(id)){
   rejected.push({id,reason:'ALREADY_TRAINED_IDEMPOTENT_SKIP'});continue;
  }
  const obs=observations.get(id),out=outcomes.get(id);
  if(!obs||!out){rejected.push({id,reason:'MISSING_PRE_OUTCOME_OBSERVATION_OR_MATURED_LABEL'});continue}
  // Hash chain alone is not trusted clock attestation. Validate original record against recorded time.
  S.verifyFrame(obs,obs.captured_at_ms);
  S.verifyOutcome(out,docs,now);
  const decision=obs.decisions.find(x=>x.engine===model.expert);
  if(!decision||!['LONG','SHORT'].includes(decision.side)||
    out.engine!==model.expert||out.label_type!=='PAPER_SIMULATED'){
   rejected.push({id,reason:'NO_MATCHED_ENGINE_PAPER_OUTCOME'});continue;
  }
  if(row.train_split!=='REGISTERED_TRAIN_ONLY'||row.holdout===true||
    row.paper_rule_registered!==true||row.source_audited!==true||
    row.outcome_audited!==true||row.cost_provenance!=='ASSUMED_PAPER'||
    row.market!==obs.market||row.predicted_at_ms!==obs.predicted_at_ms||
    row.matured_at_ms!==obs.mature_after_ms||
    row.recorded_outcome_ms!==out.recorded_at_ms||
    row.model_version_sha256!==decision.version_sha256||
    row.input_sha256!==obs.input_sha256||
    !Number.isFinite(row.gross_paper_pct)||
    row.gross_paper_pct!==out.gross_paper_pct||
    row.assumed_cost_bps!==out.assumed_cost_bps||
    row.feature_snapshot_sha256!==hash(row.features)){
   rejected.push({id,reason:'SOURCE_SPLIT_COST_OR_FEATURE_PROVENANCE_FAILED'});continue;
  }
  let features;
  try{features=T.normalize(row.features)}catch{rejected.push({id,reason:'INVALID_OBSERVATION_MASK'});continue}
  // Full seven-feature learner cannot treat missing inputs as genuinely observed zeros.
  if(features.mask.some(x=>x!==1)){rejected.push({id,reason:'INCOMPLETE_FEATURE_PROVENANCE'});continue}
  if(out.recorded_at_ms>now||out.recorded_at_ms<obs.mature_after_ms){
   rejected.push({id,reason:'OUTCOME_NOT_MATURED'});continue;
  }
  eligible.push({id,expert:model.expert,
   predicted_at_ms:obs.predicted_at_ms,matured_at_ms:out.recorded_at_ms,
   available_to_model_ms:obs.available_to_model_ms,features:features.values,
   win_label:out.gross_paper_pct-out.assumed_cost_bps/100>0?1:0,
   purpose:'TRAIN',label_source:'MATURED_FROZEN_PAPER_SIM',
   registration_locked:true,source_verified:true});
 }
 eligible.sort((a,b)=>a.matured_at_ms-b.matured_at_ms||a.id.localeCompare(b.id));
 return {eligible,rejected};
}
function advance(model,journal,records,now){
 const {eligible,rejected}=inspect(journal,records,now,model);
 let next={...model,challenger:structuredClone(model.challenger),
  processed_ids:[...model.processed_ids]},applied=0,skipped=0;
 for(const row of eligible){
  if(row.matured_at_ms<=next.challenger.last_matured_ms){
   skipped++;continue; // same-timestamp outcomes require batched model update in a future implementation
  }
  const x=M.update(next.challenger,row);
  next.challenger=x.next;next.processed_ids.push(row.id);applied++;
 }
 if(next.processed_ids.length>50000)fail('Ledger capacity: archival checkpoint required');
 next.last_training_outcome_ms=next.challenger.last_matured_ms;
 if(applied)next.proposal_seq++;
 const comparison=G.challenge(
  {model_sha256:M.fingerprint(next.champion)},
  {model_sha256:M.fingerprint(next.challenger)},[]); // ZERO independent proof; never promote
 return {next,report:{schema:'invo-v10-adaptive-research-step-1',
  accepted_for_training:applied,rejected,skipped_due_to_chronology:skipped,
  champion_sha256:M.fingerprint(next.champion),
  challenger_sha256:M.fingerprint(next.challenger),
  challenger_updates:next.challenger.updates,
  comparison_action:comparison.action,independent_forward_net_evidence:0,
  production_promotion_allowed:false,live_orders_allowed:false,
  trained_on:'AUDITED_FUTURE_PAPER_TRAIN_SPLIT_ONLY',
  readiness:'CHALLENGER_RESEARCH_ONLY'}};
}
module.exports={init,inspect,advance,hash};
