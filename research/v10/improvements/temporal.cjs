'use strict';
// v10.2: chronological, no-lookahead expert pipeline. In-sample historical development ONLY.
const M=require('../learners/specialists.cjs'),REG=require('../learners/registration.json');
const SPLITS=Object.freeze({EXPERT_TRAIN:['2026-04','2026-05'],META_TRAIN:['2026-06','2026-07'],
 VALIDATE:['2026-08'],RETROSPECTIVE_AUDIT:['2026-09']});
function stageFor(month){for(const [k,months] of Object.entries(SPLITS))if(months.includes(month))return k;throw Error('Unregistered chronology month');}
function verifyRow(r){
 if(!REG.experts.includes(r.expert)||!['BTCUSDT','ETHUSDT','SOLUSDT'].includes(r.market)||
 !['LONG','SHORT'].includes(r.side)||!Number.isSafeInteger(r.predicted_at_ms)||
 !Number.isSafeInteger(r.matured_at_ms)||r.matured_at_ms<=r.predicted_at_ms||
 !Number.isSafeInteger(r.available_to_model_ms)||r.available_to_model_ms>r.predicted_at_ms||
 ![0,1].includes(r.win_label)||!Number.isFinite(r.net_paper_pct)||
 typeof r.archive_sha256!=='string'||!/^[a-f0-9]{64}$/.test(r.archive_sha256)||
 r.label_source!=='MATURED_FROZEN_PAPER_SIM'||!r.features)throw Error('Invalid historical label provenance');
 const month=new Date(r.predicted_at_ms).toISOString().slice(0,7);
 if(!Object.values(SPLITS).flat().includes(month)||r.matured_at_ms>=Date.parse(month+'-01T00:00:00Z')+
 (new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5)),0)).getUTCDate())*86400000)
 throw Error('Label crosses split month boundary');
 M.assertFeatures(r.features);
 return month;
}
function fitExperts(rows,models){
 let updated=0;
 const sorted=[...rows].sort((a,b)=>a.matured_at_ms-b.matured_at_ms||a.expert.localeCompare(b.expert));
 for(const r of sorted){
  const month=verifyRow(r);
  if(stageFor(month)!=='EXPERT_TRAIN')throw Error('Forbidden cross-split expert training');
  if(!models[r.expert])models[r.expert]=M.create(r.expert,'april-may-expert-training');
  const m=models[r.expert];if(r.matured_at_ms<=m.last_matured_ms)throw Error('Noncausal duplicate update');
  models[r.expert]=M.update(m,{...r,purpose:'TRAIN',registration_locked:true,source_verified:true}).next;
  updated++;
 }
 return {updated,models};
}
function scoreFrozen(rows,models,expectedStage){
 const stats={examples:0,mean_brier:null,mean_net_fixed_pct:null,mean_net_threshold_pct:null,
  threshold_trades:0,independent_prospective:false,actual_execution:false};
 let sumBrier=0,sumNet=0,selectNet=0;
 const threshold=.6;
 for(const r of rows){
  const month=verifyRow(r);
  if(stageFor(month)!==expectedStage||expectedStage==='EXPERT_TRAIN')throw Error('Forbidden evaluation stage');
  const m=models[r.expert];if(!m)continue;
  const p=M.probability(m,r.features);
  stats.examples++;sumBrier+=(p-r.win_label)**2;sumNet+=r.net_paper_pct;
  if(p>=threshold){stats.threshold_trades++;selectNet+=r.net_paper_pct;}
 }
 if(stats.examples){stats.mean_brier=sumBrier/stats.examples;stats.mean_net_fixed_pct=sumNet/stats.examples;}
 if(stats.threshold_trades)stats.mean_net_threshold_pct=selectNet/stats.threshold_trades;
 return stats;
}
module.exports={SPLITS,stageFor,verifyRow,fitExperts,scoreFrozen};
