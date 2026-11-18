'use strict';
// MAHORAGA v10.3 evidence auditor: deterministic, non-promotable, no account/trading access.
const F=require('./forward.cjs'),R=require('./registration.json');
function check(ok,message){if(!ok)throw Error(message)}
function audit(receipt,sources={},outcomeReceipts=[]){
 check(receipt?.schema==='mahoraga-v103-capture-receipt-v1'&&
   receipt.registration_sha256===F.hash(R)&&receipt.live_orders===false&&
   receipt.training_eligible===false&&receipt.independent_external_attestation===false&&
   Array.isArray(receipt.observations)&&Array.isArray(receipt.gaps),
   'Invalid untrusted capture receipt');
 const seen=new Set(),markets=new Set(),decisions={LONG:0,SHORT:0,NONE:0};
 for(const o of receipt.observations){
  F.verifyObservation(o);
  check(!seen.has(o.id)&&!markets.has(o.market),'Duplicate or conflicting observation');
  seen.add(o.id);markets.add(o.market);decisions[o.side]++;
  const ref=sources[o.market];
  check(ref&&ref.source_sha256===F.hash(ref.raw)&&
    ref.source_sha256===o.source_raw_sha256&&ref.received_at_ms===o.received_at_ms,
    'Public pre-outcome raw source provenance missing');
  check(JSON.stringify(F.propose(ref.raw,ref.received_at_ms,o.decision_time_ms))===JSON.stringify(o),
    'Pre-outcome decision cannot be reproduced from source');
 }
 const gaps=new Set();
 for(const g of receipt.gaps){
  check(g?.schema==='mahoraga-v103-capture-gap-v1'&&R.markets.includes(g.market)&&
    g.no_backfill===true&&g.training_eligible===false&&g.approved_for_live===false&&
    !markets.has(g.market)&&!gaps.has(g.market),
    'Invalid or overlapping capture gap');
  gaps.add(g.market);
 }
 check(markets.size+gaps.size===R.markets.length,'Missing observed or gap market');
 let labeled=0,missing=0,paper=0,noTrade=0;
 const labelSeen=new Set();
 for(const group of outcomeReceipts){
  check(group?.source_receipt_sha256===F.hash(JSON.stringify(receipt,null,2)+'\\n')&&group.independent_external_attestation===false&&
    group.portfolio_profitability_verified===false&&group.approved_for_live===false&&
    group.no_live_orders===true&&Array.isArray(group.outcomes),
    'Outcome receipt not research-safe');
  for(const x of group.outcomes){
   check(seen.has(x.observation_id)&&!labelSeen.has(x.observation_id)&&
     x.research_only===true&&x.profitability_verified===false&&
     x.actual_fill_verified===false&&x.approved_for_live===false&&
     x.forward_sample_authenticated_externally===false,
     'Missing, duplicated or promoted outcome');
   const original=receipt.observations.find(o=>o.id===x.observation_id);
   check(x.recorded_at_ms>=original.mature_after_ms&&x.market===original.market&&
     x.side===original.side,'Premature or mismatched outcome');
   if(x.status==='PAPER_OUTCOME_WITH_FUNDING_UNKNOWN'){
    check(x.paper_net_including_funding===null&&Number.isFinite(x.paper_net_ex_funding)&&
      typeof x.source_exit_sha256==='string',
      'Funding or exit price falsely verified');
    paper++;
   }else if(x.status==='NO_TRADE'){
    check(original.side==='NONE'&&x.paper_net_ex_funding===null,'Invalid abstention outcome');
    noTrade++;
   }else{
    check(x.paper_net_ex_funding===null,'Missing-data label smuggled PNL');
    missing++;
   }
   labelSeen.add(x.observation_id);labeled++;
  }
 }
 return {schema:'mahoraga-v103-forward-audit-v1',registered_at:R.start_utc,
   capture_run_id:receipt.run_id,observations:seen.size,source_gaps:gaps.size,
   decisions,matched_labels:labeled,paper_ex_funding:paper,abstentions_labeled:noTrade,
   missing_data_labels:missing,pending_labels:seen.size-labeled,
   independent_externally_attested_samples:0,training_eligible_samples:0,
   full_venue_costs_verified:false,profitability_verified:false,
   automated_strategy_promotion:false,approved_for_live:false,production_changed:false,
   verdict:'FORWARD_RESEARCH_ONLY_NO_PROMOTION'};
}
module.exports={audit};
