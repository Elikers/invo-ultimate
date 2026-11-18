'use strict';
// Phase E — matched shadow comparisons. Statistical screen, not live ROI proof.
function compare(rows,{registrationId,minPairs=100,minGroups=3,maxDrawdownPct=20}={}){
 if(!Array.isArray(rows)||typeof registrationId!=='string'||!Number.isInteger(minPairs)||minPairs<1)
 throw Error('INVALID_COMPARISON_PLAN');
 const seen=new Set();const grouped=new Map();let candidate=0,baseline=0,all=[];
 for(const r of rows){
  if(r.registrationId!==registrationId||r.prospective!==true||
   !Number.isSafeInteger(r.predictedAtMs)||!Number.isSafeInteger(r.maturedAtMs)||
   r.maturedAtMs<=r.predictedAtMs||!Number.isFinite(r.candidateNetPct)||
   !Number.isFinite(r.baselineNetPct)||!Number.isFinite(r.candidateCostBps)||
   !Number.isFinite(r.baselineCostBps)||r.candidateCostBps<0||r.baselineCostBps<0||
   typeof r.market!=='string'||!/^20\d{2}-\d\d-\d\d$/.test(r.day)||
   typeof r.modelVersion!=='string'||r.modelVersion.length<8)
   throw Error('NON_PROSPECTIVE_OR_UNVERIFIED_PAIR');
  const id=r.market+'|'+r.predictedAtMs+'|'+r.modelVersion;
  if(seen.has(id))throw Error('DUPLICATE_PAIRED_OPPORTUNITY');seen.add(id);
  const delta=r.candidateNetPct-r.baselineNetPct;
  const key=r.market+'|'+r.day;
  const g=grouped.get(key)||{sum:0,n:0};g.sum+=delta;g.n++;grouped.set(key,g);
  candidate+=r.candidateNetPct;baseline+=r.baselineNetPct;all.push(delta);
 }
 const n=all.length;
 const daily=[...grouped.values()].map(g=>g.sum/g.n);
 const mean=n?all.reduce((s,x)=>s+x,0)/n:null;
 // Cluster-day standard error is a *screen*; serial dependence across days remains possible.
 const k=daily.length,blockMean=k?daily.reduce((s,x)=>s+x,0)/k:null;
 const variance=k>1?daily.reduce((s,x)=>s+(x-blockMean)**2,0)/(k-1):null;
 const conservativeLower=k>1?blockMean-1.96*Math.sqrt(variance/k):null;
 // Drawdown cannot be verified from an unordered event list with overlapping positions.
 const reasons=[];
 if(n<minPairs)reasons.push('INSUFFICIENT_PAIRED_OBSERVATIONS');
 if(k<minGroups)reasons.push('INSUFFICIENT_DISTINCT_MARKET_DAYS');
 if(conservativeLower===null||conservativeLower<=0)reasons.push('NO_POSITIVE_CLUSTER_SCREEN');
 reasons.push('REAL_EXECUTION_AND_PORTFOLIO_DRAWDOWN_NOT_VERIFIED');
 return {schema:'invo-v10-paired-shadow-screen-1',n,marketDays:k,
  candidateMeanNetPct:n?candidate/n:null,baselineMeanNetPct:n?baseline/n:null,
  pairedMeanDeltaPct:mean,descriptiveMarketDayLower95Pct:conservativeLower,
  independentForwardApproved:false,automaticPromotion:false,
  status:'RESEARCH_ONLY_HOLD',blockers:reasons,
  caveat:'Normal-approximation market-day screen is NOT a validated 95% confidence interval under serial dependence, tuning or market clustering. No realized fills, funding, overlapping portfolio drawdown or live account PnL.'};
}
module.exports={compare};
