'use strict';
// v8.8: evidence-only candidate release evaluation. NEVER authorizes production changes.
function judge(evidence){
 if(!evidence||typeof evidence!=='object')throw Error('Missing independent candidate evidence');
 const reject=[];
 const total=evidence.forward_closed;
 if(!Number.isInteger(total)||total<0)throw Error('Invalid sample size');
 if(total<100)reject.push('FORWARD_TOTAL_BELOW_100');
 if(!Array.isArray(evidence.market_groups)||!evidence.market_groups.length)
  reject.push('NO_REGISTERED_MARKET_GROUPS');
 else for(const g of evidence.market_groups){
  if(!Number.isInteger(g.closed)||g.closed<0||g.closed<30)
   reject.push('GROUP_BELOW_30_OR_INVALID_'+(g.market||'UNKNOWN'));
 }
 if(evidence.preregistered!==true)reject.push('NO_PRIOR_REGISTRATION');
 if(evidence.independent_forward_period!==true)reject.push('NO_INDEPENDENT_FORWARD_PERIOD');
 if(evidence.realistic_costs_verified!==true)reject.push('COSTS_UNVERIFIED');
 if(evidence.no_missing_data_gaps!==true)reject.push('COLLECTOR_GAPS_UNRESOLVED');
 if(!Number.isFinite(evidence.lower_95_pct)||evidence.lower_95_pct<=0)
   reject.push('NO_POSITIVE_LOWER_CONFIDENCE_BOUND');
 if(!Number.isFinite(evidence.max_drawdown_pct)||evidence.max_drawdown_pct>=20)
   reject.push('DRAWDOWN_NOT_VERIFIED_BELOW_20');
 if(evidence.multiple_testing_controlled!==true)reject.push('MULTIPLE_TESTING_UNCONTROLLED');
 return {schema:'invo-v8.8-no-auto-promotion-1',
  research_review_status:reject.length?'REJECT_OR_HOLD':'MANUAL_INDEPENDENT_REVIEW_REQUIRED',
  failed_gates:reject,
  production_promotion_allowed:false,real_money_order_allowed:false,
  warning:'Even all listed gates passing does not authorize risk changes, live orders or deployment.'};
}
module.exports={judge};
