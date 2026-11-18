'use strict';
// v10.4: paired counterfactual paper comparison on identical registered opportunities.
// Cluster by UTC day. No claim that daily clustering removes all market dependence.
const REG=require('../learners/registration.json');
function evaluate(rows,{registered=false,prospective=false,costReceiptVerified=false,
  closedPositionsVerified=false,minimumDays=20}={}){
 if(!Array.isArray(rows)||!rows.length)throw Error('No paired observations');
 if(!Number.isSafeInteger(minimumDays)||minimumDays<5)throw Error('Invalid calendar sample floor');
 const ids=new Set(),byDay=new Map();let baselineSum=0,expertSum=0,mahoragaSum=0,
 baselineTrades=0,expertTrades=0,mahoragaTrades=0;
 for(const x of rows){
  if(typeof x.id!=='string'||ids.has(x.id)||!Number.isSafeInteger(x.predicted_at_ms)||
   !Number.isSafeInteger(x.outcome_matured_ms)||x.outcome_matured_ms<=x.predicted_at_ms||
   !Number.isSafeInteger(x.feature_available_ms)||x.feature_available_ms>x.predicted_at_ms||
   !REG.experts.includes(x.expert)||!['RETROSPECTIVE','PROSPECTIVE_SHADOW'].includes(x.evidence_kind)||
   !Number.isFinite(x.fixed_net_pct)||!Number.isFinite(x.expert_net_pct)||
   !Number.isFinite(x.mahoraga_net_pct)||!['TRADE','NONE'].includes(x.fixed_action)||
   !['TRADE','NONE'].includes(x.expert_action)||!['TRADE','NONE'].includes(x.mahoraga_action)||
   x.venue_contract_verified!==true||x.cost_scenario_bps<0||!Number.isFinite(x.cost_scenario_bps))
   throw Error('Unmatched, noncausal or corrupted paired observation');
  ids.add(x.id);
  const day=new Date(x.predicted_at_ms).toISOString().slice(0,10);
  if(!byDay.has(day))byDay.set(day,{fixed:0,expert:0,mahoraga:0,n:0});
  const d=byDay.get(day);d.n++;
  // NONE corresponds to an explicit zero-return hypothetical no-trade opportunity.
  for(const [label,action,net] of [['fixed',x.fixed_action,x.fixed_net_pct],
   ['expert',x.expert_action,x.expert_net_pct],
   ['mahoraga',x.mahoraga_action,x.mahoraga_net_pct]]){
   if(action==='NONE'&&net!==0)throw Error('Abstentions must have zero opportunity return');
   d[label]+=net;
  }
  baselineSum+=x.fixed_net_pct;expertSum+=x.expert_net_pct;mahoragaSum+=x.mahoraga_net_pct;
  baselineTrades+=x.fixed_action==='TRADE'?1:0;expertTrades+=x.expert_action==='TRADE'?1:0;
  mahoragaTrades+=x.mahoraga_action==='TRADE'?1:0;
 }
 if(prospective&&rows.some(x=>x.evidence_kind!=='PROSPECTIVE_SHADOW'))
  throw Error('Retrospective records cannot be promoted as prospective');
 const daily=[...byDay.values()].map(d=>(d.mahoraga-d.fixed)/d.n),n=daily.length;
 const mean=daily.reduce((s,x)=>s+x,0)/n;
 const sd=n>1?Math.sqrt(daily.reduce((s,x)=>s+(x-mean)**2,0)/(n-1)):null;
 const lower=n>=minimumDays?mean-2.58*sd/Math.sqrt(n):null; // conservative nominal 99% approximation, not multiple-test corrected
 const blockers=[];
 if(!prospective)blockers.push('RETROSPECTIVE_EVIDENCE_ONLY');
 if(!registered)blockers.push('NOT_PREREGISTERED');
 if(!costReceiptVerified)blockers.push('COSTS_ARE_ONLY_ASSUMPTIONS');
 if(!closedPositionsVerified)blockers.push('NO_EXECUTION_FILL_AUDIT');
 if(n<minimumDays)blockers.push('TOO_FEW_INDEPENDENT_DAYS');
 if(lower===null||lower<=0)blockers.push('NO_POSITIVE_CLUSTERED_IMPROVEMENT_LOWER_BOUND');
 blockers.push('NO_FAMILYWISE_MULTIPLE_TEST_ADJUSTMENT');
 return {schema:'invo-v10-paired-evaluation-1',opportunities:rows.length,distinct_utc_days:n,
  fixed:{trades:baselineTrades,mean_per_opportunity_net_pct:baselineSum/rows.length},
  expert:{trades:expertTrades,mean_per_opportunity_net_pct:expertSum/rows.length},
  mahoraga:{trades:mahoragaTrades,mean_per_opportunity_net_pct:mahoragaSum/rows.length},
  matched_mah_vs_fixed_mean_daily_pct:mean,
  nominal_99pct_lower_daily_difference_pct:lower,
  status:'RESEARCH_ONLY_NOT_PROMOTABLE',
  blockers,research_only:true,automatic_deployment:false,
  caveat:'Daily clusters are dependent across dates and crypto assets; pseudo confidence bounds not sufficient for production or profitability claims.'};
}
module.exports={evaluate};
