'use strict';
// Gate 2: frozen chronological split and missing-feature masks.
// NO historic orderbook/funding fields are silently represented as observed zero.
const M=require('../learners/specialists.cjs'),REG=require('../learners/registration.json');
const features=REG.feature_names;
function normalize(row){
 if(!row||typeof row!=='object'||!row.values||!row.observed||!Array.isArray(row.observed))
 throw Error('Feature provenance mask required');
 const observed=new Set(row.observed);
 if(row.observed.length!==observed.size||[...observed].some(x=>!features.includes(x)))throw Error('Invalid mask');
 const out={};
 for(const name of features){
  if(observed.has(name)){
   if(!Number.isFinite(row.values[name]))throw Error('Observed feature not numeric');
   out[name]=row.values[name];
  }else{
   if(Object.hasOwn(row.values,name))throw Error('Missing feature falsely supplied as value');
   out[name]=0; // internal encoding only; mask remains distinct and never inferred as observed
  }
 }
 M.assertFeatures(out);
 return {values:out,mask:features.map(k=>observed.has(k)?1:0)};
}
function split(rows,cutoffs){
 if(!Array.isArray(rows)||!cutoffs||!Number.isSafeInteger(cutoffs.train_end_ms)||
 !Number.isSafeInteger(cutoffs.validation_end_ms)||!Number.isSafeInteger(cutoffs.test_end_ms)||
 !(cutoffs.train_end_ms<cutoffs.validation_end_ms&&cutoffs.validation_end_ms<cutoffs.test_end_ms))
 throw Error('Unregistered chronological split');
 const out={train:[],validation:[],test:[],purged:[]};const ids=new Set();
 let last=0;
 for(const r of rows){
  if(!r||!REG.experts.includes(r.expert)||typeof r.id!=='string'||ids.has(r.id)||
   !Number.isSafeInteger(r.predicted_at_ms)||!Number.isSafeInteger(r.matured_at_ms)||
   !Number.isSafeInteger(r.feature_available_ms)||r.feature_available_ms>r.predicted_at_ms||
   r.predicted_at_ms>=r.matured_at_ms||r.predicted_at_ms<last||
   ![0,1].includes(r.win_label)||r.label_source!=='MATURED_FROZEN_PAPER_SIM'||
   r.source_verified!==true)throw Error('Invalid chronology, label or provenance');
  last=r.predicted_at_ms;ids.add(r.id);
  const end=r.predicted_at_ms<=cutoffs.train_end_ms?'train':
   r.predicted_at_ms<=cutoffs.validation_end_ms?'validation':
   r.predicted_at_ms<=cutoffs.test_end_ms?'test':null;
  if(!end)continue;
  // Purge labels crossing segment boundaries, preventing outcome leakage.
  const boundary=end==='train'?cutoffs.train_end_ms:end==='validation'?cutoffs.validation_end_ms:cutoffs.test_end_ms;
  const normalized=normalize(r.features);
  if(r.matured_at_ms>boundary)out.purged.push(r.id);
  else out[end].push({...r,features:normalized});
 }
 return out;
}
function trainOnly(rows,expert){
 if(!REG.experts.includes(expert))throw Error('Unknown expert');
 let model=M.create(expert,'v10-gate2-research-only'),count=0;
 for(const r of rows){
  if(r.expert!==expert)continue;
  if(r.purpose!=='TRAIN'||r.split!=='train'||r.features.mask.some(x=>x!==1))
   continue; // masked source fields cannot silently enter this full-feature model
  const x={...r,features:r.features.values,available_to_model_ms:r.feature_available_ms,
   registration_locked:true,source_verified:true};
  model=M.update(model,x).next;count++;
 }
 return {model,updates:count,independent_profit:null,training_data_only:true};
}
module.exports={normalize,split,trainOnly};
