'use strict';
// v10.7 immutable-input dashboard model; never reclassifies quote reference as realized P&L.
const MARKETS=['BTC','ETH','SOL'];
function reject(m){throw Error(m)}
function aggregate(reports=[],state={}){
 if(!Array.isArray(reports))reject('Reports must be verified read-only array');
 const counts=Object.fromEntries(MARKETS.map(m=>[m,{observations:0,missing:0,pending:0,
     no_trade:0,reference_only_labels:0,reference_net_ex_funding:null,
     full_cost_profit_factor:null,verified_profit:false}]));
 const means=Object.fromEntries(MARKETS.map(m=>[m,[]]));
 let sourceGaps=0;
 for(const rep of reports){
  if(rep?.schema!=='mahoraga-v105-causal-outcomes-v1'||rep.profitability_verified!==false||
     rep.approved_for_live!==false||rep.funding_reconciled!==false||
     rep.verified_full_execution_costs!==false||rep.eligibility_to_train!==false)
      reject('Unsupported or promoted economic report');
  sourceGaps+=rep.source_gaps;
  for(const market of MARKETS){
   const x=rep.markets?.[market];if(!x)reject('Absent market');
   if(![x.observations,x.missing,x.pending,x.no_trade,x.priced_reference_ex_funding]
       .every(v=>Number.isSafeInteger(v)&&v>=0)||
       x.observations!==x.missing+x.pending+x.no_trade+x.priced_reference_ex_funding)
       reject('Inconsistent coverage counters');
   const target=counts[market];
   target.observations+=x.observations;target.missing+=x.missing;
   target.pending+=x.pending;target.no_trade+=x.no_trade;
   target.reference_only_labels+=x.priced_reference_ex_funding;
   if(x.priced_reference_ex_funding>0){
    if(!Number.isFinite(x.assumed_ex_funding_mean))reject('Invalid conditional mean');
    means[market].push([x.assumed_ex_funding_mean,x.priced_reference_ex_funding]);
   }
  }
 }
 for(const market of MARKETS){
  const pairs=means[market];
  if(pairs.length){
   const n=pairs.reduce((s,x)=>s+x[1],0);
   counts[market].reference_net_ex_funding=pairs.reduce((s,x)=>s+x[0]*x[1],0)/n;
  }
 }
 const candidateRevisions=Number.isSafeInteger(state.research_challenger_revision)?
   state.research_challenger_revision:0;
 return {schema:'mahoraga-v107-readonly-analytics-v1',
   generated_at_utc:new Date().toISOString(),markets:counts,source_gaps:sourceGaps,
   evidence_reports_count:reports.length,challenger_revision:candidateRevisions,
   data_origin:reports.length?'VALIDATED_CAUSAL_PAPER_REFERENCE_ONLY':'NO_VERIFIED_FORWARD_REPORTS_LOADED',
   full_cost_forward_profitability:null,live_account_return:null,
   independent_offsite_backup_verified:false,automated_scheduler_active:false,
   auto_promotion:false,live_orders:false,production_website_changed:false,
   verdict:'NO_FORWARD_PROFITABILITY_VERIFIED'};
}
module.exports={aggregate};
