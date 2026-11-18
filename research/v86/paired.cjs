'use strict';
// v8.6 comparative AI research safety gate. No model trained, generated or promoted here.
function evaluate(entries,registration,nowMs=Date.now()){
 if(!registration||!/^[a-f0-9]{40}$/.test(registration.commit_sha||'')||
   !Number.isFinite(Date.parse(registration.registered_utc)))throw Error('Missing immutable prior registration');
 if(!Array.isArray(entries))throw Error('Invalid candidate ledger');
 const registered=Date.parse(registration.registered_utc),ids=new Set(),deltas=[];
 for(const x of entries){
  if(!x||typeof x.id!=='string'||ids.has(x.id))throw Error('Duplicate/invalid observation id');
  ids.add(x.id);
  if(!['BTC','ETH','SOL','JUP'].includes(x.market))throw Error('Invalid market');
  if(!Number.isSafeInteger(x.predicted_at)||!Number.isSafeInteger(x.outcome_at)||
   x.predicted_at<=registered||x.outcome_at<=x.predicted_at||x.outcome_at>nowMs)
    throw Error('Prediction/outcome chronology violation');
  if(!Number.isFinite(x.candidate_net_pct)||!Number.isFinite(x.baseline_net_pct)||
   x.cost_verified!==true)throw Error('Unverified matched net trade');
  deltas.push(x.candidate_net_pct-x.baseline_net_pct);
 }
 const n=deltas.length,mean=n?deltas.reduce((a,b)=>a+b,0)/n:null;
 return {schema:'invo-v8.6-paired-candidate-gate-1',registration_commit_sha:registration.commit_sha,
  matched_forward_observations:n,paired_mean_improvement_pct:mean,
  outcome:n<100?'INSUFFICIENT_PAIRED_FORWARD_EVIDENCE':'INDEPENDENT_RISK_REVIEW_REQUIRED',
  statistical_independence_unverified:true,automatic_promotion:false,
  limitations:['Matched timestamps and cost provenance do not establish exchange fills.',
   'Uncorrected mean does not account for serial correlation, multiple testing or uncertainty.',
   'Requires separate predeclared models, blind forward labels and an independent adjudication before selection.']};
}
module.exports={evaluate};
