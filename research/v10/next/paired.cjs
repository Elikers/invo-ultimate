'use strict';
// Gate 4: registered paired, chronological prospective comparison; date-cluster bootstrap.
// Descriptive research, no automatic promotion or profit promise.
const crypto=require('node:crypto'),REG=require('../learners/registration.json');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function evaluate(rows,registration){
 if(!Array.isArray(rows)||!registration||typeof registration.sha256!=='string'||
 !/^[a-f0-9]{64}$/.test(registration.sha256)||
 !Number.isSafeInteger(registration.start_ms))throw Error('Unregistered forward evidence');
 const bad=[],grouped=new Map(REG.experts.map(x=>[x,[]])),seen=new Set();
 for(const r of rows){
  if(!r||!REG.experts.includes(r.expert)||!Number.isSafeInteger(r.predicted_at_ms)||
   !Number.isSafeInteger(r.matured_at_ms)||r.predicted_at_ms<registration.start_ms||
   r.matured_at_ms<=r.predicted_at_ms||r.matured_at_ms>Date.now()||
   !Number.isFinite(r.challenger_gross_pct)||!Number.isFinite(r.baseline_gross_pct)||
   !Number.isFinite(r.challenger_cost_bps)||!Number.isFinite(r.baseline_cost_bps)||
   r.challenger_cost_bps<0||r.baseline_cost_bps<0||
   r.registration_sha256!==registration.sha256||r.forward_only!==true||
   r.frozen_before_prediction!==true||r.matched_opportunity!==true||
   r.source_verified!==true||r.costs_verified!==true||r.test_only!==true||
   r.from_training===true||typeof r.id!=='string'||seen.has(r.id)){
    bad.push(r?.id??'UNKNOWN');continue;
  }
  seen.add(r.id);
  grouped.get(r.expert).push({day:new Date(r.predicted_at_ms).toISOString().slice(0,10),
   diff:r.challenger_gross_pct-r.challenger_cost_bps/100-
    (r.baseline_gross_pct-r.baseline_cost_bps/100)});
 }
 const out=[];
 for(const [id,v] of grouped){
  const days=new Map();for(const r of v){if(!days.has(r.day))days.set(r.day,[]);days.get(r.day).push(r.diff)}
  const clusters=[...days.values()],means=[],seed=Number.parseInt(sha(id+registration.sha256).slice(0,8),16);
  let state=seed||1;const rand=()=>{state=(1664525*state+1013904223)>>>0;return state/4294967296};
  // Cluster-resample whole days, preserving same-day dependence.
  if(clusters.length>=5){
   for(let b=0;b<1000;b++){
    let sum=0,n=0;
    for(let k=0;k<clusters.length;k++){
     const block=clusters[Math.floor(rand()*clusters.length)];
     for(const d of block){sum+=d;n++}
    }
    means.push(sum/n);
   }
   means.sort((a,b)=>a-b);
  }
  const mean=v.length?v.reduce((s,r)=>s+r.diff,0)/v.length:null;
  const lower=means.length?means[Math.floor(.05/REG.experts.length*means.length)]:null;
  out.push({expert:id,closed:v.length,days:clusters.length,paired_net_advantage_pct:mean,
   conservative_cluster_lower_pct:lower,independent_advantage_demonstrated:v.length>=30&&
    clusters.length>=5&&lower!==null&&lower>0});
 }
 const blockers=[];
 if(bad.length)blockers.push('INVALID_OR_LEAKED_FORWARD_RECORDS');
 if(rows.length<100)blockers.push('TOTAL_PROSPECTIVE_SAMPLE_TOO_SMALL');
 if(out.some(x=>!x.independent_advantage_demonstrated))blockers.push('UNPROVEN_EIGHT_GROUP_ADAPTIVE_NET_ADVANTAGE');
 return {schema:'invo-v10-gate4-paired-audit-1',status:blockers.length?'BLOCKED':'HUMAN_REVIEW_ONLY',
  records:rows.length,invalid:bad.length,groups:out,blockers,
  method:'1000 date-cluster bootstrap resamples, eight-way conservative one-sided lower quantile',
  no_automatic_promotion:true,no_live_orders:true,
  warning:'Resampling and observed profitability cannot guarantee future returns. Real execution and economic verification still require audit.'};
}
module.exports={evaluate};
