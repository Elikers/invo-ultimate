'use strict';
/* v9.4 independent forward profitability review is never automatic production authorization. */
const crypto=require('node:crypto');
function review(report,registration){
 if(!report||!registration||!Array.isArray(report.groups))throw Error('Missing candidate evidence/registration');
 if(registration.schema!=='invo-v9.1-immutable-candidate-plan-1'&&registration.schema!=='invo-v9.2-preregistered-regime-filter-1')
  throw Error('Unregistered candidate family');
 const reasons=[];
 if(report.registration_sha!==registration.committed_sha||
  !/^[a-f0-9]{40}$/.test(report.registration_sha||''))reasons.push('REGISTRATION_COMMIT_NOT_VERIFIED');
 if(report.forward_only!==true)reasons.push('NO_INDEPENDENT_FORWARD_PROVENANCE');
 if(report.execution_fills_verified!==true)reasons.push('NO_VERIFIED_EXCHANGE_FILLS');
 if(report.costs_reconciled!==true)reasons.push('COST_RECONCILIATION_UNVERIFIED');
 if(report.correlation_adjusted!==true||report.multiple_testing_adjusted!==true)
  reasons.push('DEPENDENCE_OR_MULTIPLE_TESTING_UNRESOLVED');
 if(report.collector_gaps_resolved!==true)reasons.push('COLLECTOR_GAPS_UNRESOLVED');
 if(report.groups.length<1)reasons.push('NO_CANDIDATE_GROUPS');
 let total=0;
 for(const g of report.groups){
  if(!Number.isInteger(g.closed)||g.closed<0)throw Error('Invalid group count');
  total+=g.closed;
  if(g.closed<30)reasons.push('GROUP_UNDER_30_'+String(g.id));
  if(!Number.isFinite(g.lower_ci_95_net_pct)||g.lower_ci_95_net_pct<=0)
    reasons.push('NO_POSITIVE_95PCT_LOWER_BOUND_'+String(g.id));
  if(!Number.isFinite(g.max_drawdown_pct)||g.max_drawdown_pct>=20)
    reasons.push('TAIL_RISK_NOT_VALIDATED_'+String(g.id));
 }
 if(total<100)reasons.push('TOTAL_UNDER_100');
 return {schema:'invo-v9.4-review-only-1',candidate_closed_sum:total,
  outcome:reasons.length?'INSUFFICIENT_OR_NEGATIVE_EVIDENCE':'INDEPENDENT_HUMAN_AUDIT_REQUIRED',
  blockers:reasons,production_promotion:false,real_money_trading:false,
  disclaimer:'Sample floors and even a positive lower confidence bound never authorize automatic deployment.'};
}
module.exports={review};
