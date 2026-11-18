'use strict';
/* Minimal versioned online model for OFFLINE research. No internet and no deployment.
 * Parameters update only on explicitly matured chronological TRAIN examples.
 */
const crypto=require('node:crypto'),REG=require('./registration.json');
const N=REG.feature_names.length,EXP=new Set(REG.experts);
function assertFeatures(x){
 if(!x||typeof x!=='object')throw Error('Missing features');
 return REG.feature_names.map(k=>{
  if(!Number.isFinite(x[k])||Math.abs(x[k])>REG.feature_bounds[k])throw Error('Feature invalid or unscaled: '+k);
  return x[k]/REG.feature_bounds[k];
 });
}
function create(expert,regId='v10-offline-fixture'){
 if(!EXP.has(expert))throw Error('Unknown/unregistered specialist');
 return {schema:'invo-v10-online-specialist-1',expert,regId,weights:Array(N).fill(0),bias:0,
    updates:0,last_matured_ms:0,version:0,source:'OFFLINE_ONLY_UNVALIDATED'};
}
function probability(state,features){
 if(state?.schema!=='invo-v10-online-specialist-1'||!EXP.has(state.expert)||state.weights?.length!==N)
  throw Error('Invalid model');
 const xs=assertFeatures(features);
 const z=Math.max(-30,Math.min(30,state.bias+xs.reduce((s,x,i)=>s+x*state.weights[i],0)));
 return 1/(1+Math.exp(-z));
}
function update(state,row,settings={}){
 if(!state||!row||row.expert!==state.expert||row.purpose!=='TRAIN'||
 row.label_source!=='MATURED_FROZEN_PAPER_SIM'||
 !Number.isSafeInteger(row.predicted_at_ms)||!Number.isSafeInteger(row.matured_at_ms)||
 row.predicted_at_ms>=row.matured_at_ms||
 row.matured_at_ms<=state.last_matured_ms||
 !Number.isSafeInteger(row.available_to_model_ms)||row.available_to_model_ms>row.predicted_at_ms||
 ![0,1].includes(row.win_label)||
 row.future_test_segment===true||!row.registration_locked||!row.source_verified)
 throw Error('Invalid training chronology, provenance or matured outcome');
 const x=assertFeatures(row.features);
 const p=probability(state,row.features);
 const lr=settings.lr??0.05,decay=settings.decay??0.001;
 if(!Number.isFinite(lr)||lr<=0||lr>0.1||!Number.isFinite(decay)||decay<0||decay>0.01)
 throw Error('Unsafe learning hyperparameters');
 const err=Math.max(-1,Math.min(1,row.win_label-p));
 const next={...state,weights:state.weights.map((w,i)=>Math.max(-4,Math.min(4,(1-lr*decay)*w+lr*err*x[i]))),
 bias:Math.max(-4,Math.min(4,state.bias+lr*err)),updates:state.updates+1,
 last_matured_ms:row.matured_at_ms,version:state.version+1};
 return {next,before_probability:p,trained_on:'MATURED_PAPER_LABEL_NOT_REAL_PROFIT'};
}
function fingerprint(state){return crypto.createHash('sha256').update(JSON.stringify(state)).digest('hex');}
module.exports={create,probability,update,fingerprint,assertFeatures};
