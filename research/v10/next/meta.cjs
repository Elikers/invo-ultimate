'use strict';
// Gate 3: learn cost-aware signed expected paper returns, never live orders.
// Requires matched eight-expert timestamped predictions; no automatic promotion.
const REG=require('../learners/registration.json'),crypto=require('node:crypto');
const ids=REG.experts;
function vector(row){
 if(!row||!Array.isArray(row.experts)||row.experts.length!==ids.length||
 !Number.isSafeInteger(row.predicted_at_ms)||!Number.isSafeInteger(row.feature_available_ms)||
 row.feature_available_ms>row.predicted_at_ms||row.source_verified!==true)
 throw Error('Untrusted matched experts');
 const seen=new Set();
 const v=ids.map(id=>{
  const e=row.experts.find(x=>x.expert===id);
  if(!e||seen.has(e.expert)||!['LONG','SHORT','NONE'].includes(e.side)||
   !Number.isFinite(e.probability)||e.probability<0||e.probability>1||
   !Number.isFinite(e.reliability)||e.reliability<0||e.reliability>1||
   e.model_frozen_before_prediction!==true||e.predicted_at_ms!==row.predicted_at_ms)
   throw Error('Unmatched, nonfrozen or malformed expert');
  seen.add(e.expert);
  return e.side==='NONE'?0:(e.side==='LONG'?1:-1)*Math.max(0,(e.probability-.5)*2)*e.reliability;
 });
 return v;
}
function init(registration){
 if(typeof registration!=='string'||registration.length<8)throw Error('Registration required');
 return {schema:'invo-v10-research-net-meta-1',registration,
  weights:Array(ids.length).fill(0),bias:0,updates:0,last_matured_ms:0,
  research_only:true,training_data_only:true,profitability_verified:false};
}
function predict(model,row){
 if(model?.schema!=='invo-v10-research-net-meta-1')throw Error('Unregistered meta model');
 const v=vector(row);
 return Math.max(-2,Math.min(2,model.bias+v.reduce((s,x,i)=>s+x*model.weights[i],0)));
}
function train(model,row){
 if(row?.purpose!=='TRAIN'||row?.split!=='train'||row?.source_verified!==true||
 row?.label_source!=='MATURED_FROZEN_PAPER_SIM'||row?.registration_locked!==true||
 !Number.isSafeInteger(row.matured_at_ms)||row.matured_at_ms<=row.predicted_at_ms||
 row.matured_at_ms<=model.last_matured_ms||
 !Number.isFinite(row.gross_paper_pct)||!Number.isFinite(row.cost_bps)||
 row.cost_bps<0||row.cost_bps>500||row.test_holdout===true)
 throw Error('Invalid matured, cost-aware training label');
 const v=vector(row),net=Math.max(-2,Math.min(2,row.gross_paper_pct-row.cost_bps/100));
 const error=Math.max(-2,Math.min(2,net-predict(model,row))),lr=.025;
 return {...model,weights:model.weights.map((w,i)=>Math.max(-2,Math.min(2,w+lr*error*v[i]))),
  bias:Math.max(-2,Math.min(2,model.bias+lr*error)),updates:model.updates+1,
  last_matured_ms:row.matured_at_ms};
}
function advisory(model,row,gate){
 const estimated=predict(model,row);
 if(model.updates<30||gate?.verified_data!==true||gate?.costs_sourced!==true||
 gate?.held_out_model_version!==true)return {side:'NONE',reason:'UNVALIDATED_META_OR_DATA',trade_authorized:false,
  expected_net_pct:null};
 // Model sign is only a research estimate, not a validated edge.
 const side=estimated>.1?'LONG':estimated<-.1?'SHORT':'NONE';
 return {side,reason:'RESEARCH_PREDICTION_UNVERIFIED',expected_net_pct:estimated,
  trade_authorized:false,production_promotion:false};
}
function fingerprint(m){return crypto.createHash('sha256').update(JSON.stringify(m)).digest('hex');}
module.exports={init,vector,predict,train,advisory,fingerprint};
