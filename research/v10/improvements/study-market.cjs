'use strict';
/* Bounded real retrospective full six-month research.
 * Archived Binance candles verified against official ZIP SHA-256 every month.
 * APR-MAY train seven experts; JUN-JUL train independent meta on FROZEN expert versions;
 * AUG validate without fitting; SEP previously inspected historical audit, NOT unseen.
 * Only outcome labels from v6.1 frozen paper sim. NO independent forward sample.
 */
const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const C=require('../../../v61-core.js'),R=require('../../run.cjs'),M=require('../learners/specialists.cjs');
const T=require('./temporal.cjs'),META=require('./meta-learner.cjs'),E=require('./evaluation.cjs');
const Hist=require('../learners/historical-train.cjs'),REG=require('../learners/registration.json'),STORE=require('./registry.cjs'),CRYPTO=require('node:crypto');
const root=path.resolve(__dirname,'../../..');
const markets=['BTCUSDT','ETHUSDT','SOLUSDT'],months=['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09'];
function rowsFromArchive(archive,signal){
 const bars=archive.bars,rows=[];
 for(const expert of REG.experts.filter(x=>x!=='scalping')){
  const sigs=Array(bars.length).fill(null);
  for(let i=65;i+12<bars.length;i++){
   const s=signal(expert,bars.slice(Math.max(0,i-900),i+1));
   if(s?.side==='LONG'||s?.side==='SHORT')sigs[i]={side:s.side};
  }
  const trades=C.simulate(bars,sigs,{stopPct:1,targetPct:1.5,costBps:8,hold:12});
  for(const tr of trades){
   const predicted_at_ms=bars[tr.signalIndex].t+300000,matured_at_ms=bars[tr.exitIndex].t+300000;
   if(new Date(matured_at_ms).toISOString().slice(0,7)!==archive.month)continue;
   rows.push({expert,market:archive.symbol,side:tr.side,predicted_at_ms,
    available_to_model_ms:predicted_at_ms,matured_at_ms,
    win_label:tr.netPct>0?1:0,net_paper_pct:tr.netPct,
    archive_sha256:archive.sha256,label_source:'MATURED_FROZEN_PAPER_SIM',
    features:Hist.features(bars,tr.signalIndex)});
  }
 }
 return rows.sort((a,b)=>a.matured_at_ms-b.matured_at_ms||a.expert.localeCompare(b.expert));
}
function scoreMeta(rows,models,meta,stage,market){
 const paired=[];let brier=0,covered=0;
 for(const r of rows){
  if(!models[r.expert])continue;
  const p=M.probability(models[r.expert],r.features),mp=META.predict(meta,{...r,expert_p:p});
  const expertAction=p>=.6?'TRADE':'NONE',metaAction=mp>=.58?'TRADE':'NONE';
  brier+=(mp-r.win_label)**2;covered++;
  paired.push({id:market+'-'+stage+'-'+r.expert+'-'+r.predicted_at_ms,expert:r.expert,
   predicted_at_ms:r.predicted_at_ms,feature_available_ms:r.available_to_model_ms,
   outcome_matured_ms:r.matured_at_ms,evidence_kind:'RETROSPECTIVE',
   fixed_action:'TRADE',expert_action:expertAction,mahoraga_action:metaAction,
   fixed_net_pct:r.net_paper_pct,
   expert_net_pct:expertAction==='TRADE'?r.net_paper_pct:0,
   mahoraga_net_pct:metaAction==='TRADE'?r.net_paper_pct:0,
   venue_contract_verified:true,cost_scenario_bps:8});
 }
 const comparison=paired.length?E.evaluate(paired,{minimumDays:20}):null;
 return {stage,examples:covered,brier:covered?brier/covered:null,
  paired_retro:comparison,actual_execution:false,
  no_retraining_on_evaluation:true};
}
function main(){
 const symbol=process.argv[2];if(!markets.includes(symbol))throw Error('Unregistered Binance market');
 const signal=R.strategyFromWebsite(fs.readFileSync(path.join(root,'index.html'),'utf8'));
 const models={},metaStart=META.init(),summary={schema:'invo-v10-six-month-retrospective-development-1',
  symbol,months:[],training_examples:0,meta_training_examples:0,
  independent_forward_trades:0,actual_exchange_fills:0,
  training_feature_sources:['OHLCV only; unavailable microstructure masked as zero'],
  scalping_model_train_examples:0,release_approved:false,
  warning:'Retrospective, already-inspected archives. Not statistically independent holdout or verified profitability.'};
 let meta=metaStart;
 for(const month of months){
  const raw=cp.execFileSync('python3',
   [path.join(root,'research/v76/monthly_archive.py'),symbol,month],
   {encoding:'utf8',timeout:180000,maxBuffer:16000000});
  const archive=JSON.parse(raw);
  if(archive.symbol!==symbol||archive.month!==month||archive.kind!=='RETROSPECTIVE_ONLY_NOT_FORWARD'||
   !/^[a-f0-9]{64}$/.test(archive.sha256)||!C.valid(archive.bars))
   throw Error('Unverified archive');
  const rows=rowsFromArchive(archive,signal),stage=T.stageFor(month);
  let details;
  if(stage==='EXPERT_TRAIN'){
   const fitted=T.fitExperts(rows,models);summary.training_examples+=fitted.updated;
   details={train_rows:fitted.updated};
  }else if(stage==='META_TRAIN'){
   const frozenExperts=JSON.stringify(models);
   const prepared=rows.filter(r=>models[r.expert]).map(r=>({...r,
    expert_p:M.probability(models[r.expert],r.features),preregistered_paper_convention:true}));
   meta=META.fit(meta,prepared);summary.meta_training_examples+=prepared.length;
   if(JSON.stringify(models)!==frozenExperts)throw Error('Specialist leakage during meta training');
   details={meta_train_rows:prepared.length};
  }else{
   const frozenExperts=JSON.stringify(models),frozenMeta=JSON.stringify(meta);
   details={specialist:T.scoreFrozen(rows,models,stage),supervisor:scoreMeta(rows,models,meta,stage,symbol)};
   if(JSON.stringify(models)!==frozenExperts||JSON.stringify(meta)!==frozenMeta)
    throw Error('Protected retrospective evaluation updated a model');
  }
  summary.months.push({month,verified_archive_sha256:archive.sha256,stage,retrospective_paper_outcomes:rows.length,
   details});
 }
 const dataDigest=CRYPTO.createHash('sha256').update(summary.months.map(x=>x.verified_archive_sha256).join('|')).digest('hex');
 const checkpointDir='mahoraga-checkpoints-'+symbol;
 summary.checkpoints={specialists:{},meta:null,scope:'RETROSPECTIVE_ONLY'};
 for(const [name,model] of Object.entries(models))
  summary.checkpoints.specialists[name]=STORE.save(checkpointDir,model,
   {locked_stage:'EXPERT_TRAIN',dataset_sha256:dataDigest,market:symbol,independent_forward_validated:false}).fingerprint;
 summary.checkpoints.meta=STORE.save(checkpointDir,meta,
  {locked_stage:'META_TRAIN',dataset_sha256:dataDigest,market:symbol,independent_forward_validated:false}).fingerprint;
 summary.expert_model_versions=Object.fromEntries(Object.entries(models).map(([id,m])=>[id,
  {updates:m.updates,fingerprint:M.fingerprint(m)}]));
 summary.meta_model={training_examples:meta.trained_rows,fingerprint:META.fingerprint(meta),
  learned_selection_calibration_only:true,full_multi_expert_portfolio_combine_evaluated:false};
 fs.writeFileSync('mahoraga-retrospective-'+symbol+'.json',JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify({status:'PASS_RETROSPECTIVE_DEVELOPMENT_ONLY',symbol,
  expert_training_examples:summary.training_examples,meta_training_examples:summary.meta_training_examples,
  monthly_counts:summary.months.map(x=>({month:x.month,stage:x.stage,outcomes:x.retrospective_paper_outcomes})),
  retrospective_scores:summary.months.filter(x=>x.details.supervisor).map(x=>({month:x.month,stage:x.stage,
    fixed_mean_net_pct:x.details.supervisor.paired_retro?.fixed.mean_per_opportunity_net_pct,
    filtered_specialist_mean_net_pct:x.details.supervisor.paired_retro?.expert.mean_per_opportunity_net_pct,
    filtered_meta_mean_net_pct:x.details.supervisor.paired_retro?.mahoraga.mean_per_opportunity_net_pct,
    meta_trade_count:x.details.supervisor.paired_retro?.mahoraga.trades,
    observations:x.details.supervisor.examples,brier:x.details.supervisor.brier,
    status:'RETROSPECTIVE_NOT_FORWARD'})),
  scalping_train_examples:0,independent_forward_trades:0,verified_net_profit:null}));
}
if(require.main===module)try{main()}catch(e){console.error('MAHORAGA_RETRO_FAIL',e.message);process.exitCode=1;}
module.exports={rowsFromArchive};
