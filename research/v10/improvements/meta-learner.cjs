'use strict';
// v10.3: independently trained historical supervisor; June-July only, after Apr-May expert freeze.
// A binary paper-win calibrator is NOT a verified net expectancy model.
const crypto=require('node:crypto'),R=require('../learners/registration.json'),T=require('./temporal.cjs');
const EXP=R.experts;
const DIM=EXP.length+4;
const sigmoid=x=>1/(1+Math.exp(-Math.max(-20,Math.min(20,x))));
function features(x){
 if(!EXP.includes(x.expert)||!Number.isFinite(x.expert_p)||x.expert_p<0||x.expert_p>1||
 !x.features||!Number.isFinite(x.features.trend)||!Number.isFinite(x.features.volatility)||
 !Number.isFinite(x.features.volume_ratio))throw Error('Invalid meta features');
 return EXP.map(e=>e===x.expert?1:0).concat([
   (x.expert_p-.5)*2,
   Math.max(-1,Math.min(1,x.features.trend/5)),
   Math.max(0,Math.min(1,x.features.volatility/5)),
   Math.max(0,Math.min(1,x.features.volume_ratio/10))
 ]);
}
function init(){return {schema:'invo-v10-meta-learner-1',weights:Array(DIM).fill(0),bias:0,
  trained_rows:0,last_matured_ms:0,last_record_id:null,version:0,training_split:'2026-06_to_2026-07',
  actual_profitability_validated:false,production_approved:false};}
function predict(m,x){
 if(m?.schema!=='invo-v10-meta-learner-1'||m.weights?.length!==DIM)throw Error('Invalid meta model');
 const v=features(x);return sigmoid(m.bias+v.reduce((s,z,i)=>s+z*m.weights[i],0));
}
function fit(model,rows){
 if(!model)throw Error('Missing meta model');
 const sorted=[...rows].sort((a,b)=>a.matured_at_ms-b.matured_at_ms||a.expert.localeCompare(b.expert));
 let next={...model,weights:model.weights.slice()};const seen=new Set();
 for(const r of sorted){
  const month=T.verifyRow(r);
  const recordId=r.expert+'|'+r.predicted_at_ms;
  if(T.stageFor(month)!=='META_TRAIN'||r.matured_at_ms<next.last_matured_ms||
   seen.has(recordId)||next.last_record_id===recordId||
   !r.preregistered_paper_convention||r.independent_test===true)
    throw Error('Leakage or nonchronological meta training');
  seen.add(recordId);const v=features(r),p=predict(next,r),y=r.net_paper_pct>0?1:0,err=y-p,lr=.03;
  next.weights=next.weights.map((w,i)=>Math.max(-4,Math.min(4,w*(1-0.00003)+lr*err*v[i])));
  next.bias=Math.max(-4,Math.min(4,next.bias+lr*err));
  next.last_matured_ms=r.matured_at_ms;next.last_record_id=recordId;
  next.trained_rows++;next.version++;
 }
 return next;
}
function combine(model,inputs,conditions={}){
 const none=reason=>({kind:'MAHORAGA_RESEARCH_ADVISORY',side:'NONE',reason,
  research_only:true,orders_authorized:false,automatic_promotion:false});
 if(conditions.data_valid!==true||conditions.costs_verified!==true)return none('NO_VERIFIED_DATA_OR_COSTS');
 if(!Array.isArray(inputs)||inputs.length<3)return none('INSUFFICIENT_EXPERTS');
 if(!Number.isFinite(conditions.spread_bps)||conditions.spread_bps>20||conditions.spread_bps<0)
  return none('UNTRUSTED_SPREAD');
 let long=0,short=0;
 const seen=new Set();
 for(const x of inputs){
  if(seen.has(x.expert)||!['LONG','SHORT','NONE'].includes(x.side))throw Error('Invalid/duplicate expert');
  seen.add(x.expert);
  if(x.side==='NONE')continue;
  const p=predict(model,x);
  if(p<.58)continue;
  const w=p-.5;
  if(x.side==='LONG')long+=w;else short+=w;
 }
 const total=long+short;if(total<.12)return none('NO_CONFIDENT_PAPER_EDGE');
 const share=Math.max(long,short)/total;
 if(share<.7)return none('EXPERT_DISAGREEMENT');
 return {...none('HISTORICAL_META_WEIGHTED_PAPER_DIRECTION'),
  side:long>short?'LONG':'SHORT',paper_support:share,net_expectancy_pct:null};
}
function fingerprint(m){return crypto.createHash('sha256').update(JSON.stringify(m)).digest('hex');}
module.exports={init,predict,fit,combine,fingerprint};
