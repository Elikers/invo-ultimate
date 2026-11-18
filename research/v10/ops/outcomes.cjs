'use strict';
// v10.5: immutable pre-outcome public receipts + later quote evidence.
// No post-hoc signals, no account P&L, no executable strategy changes.
const F=require('../forward/forward.cjs'),A=require('../forward/audit.cjs');
function reject(m){throw Error(m)}
function reconcile(capture,sources,settlement){
 const audit=A.audit(capture,sources,settlement?[settlement]:[]);
 const origins=new Map(capture.observations.map(o=>[o.id,o]));
 if(settlement){
   if(settlement.source_capture_run_id!==capture.run_id)reject('Unlinked capture run');
   for(const x of settlement.outcomes){
     const o=origins.get(x.observation_id);
     if(!o)reject('Orphaned outcome');
     if(x.status==='PAPER_OUTCOME_WITH_FUNDING_UNKNOWN'){
       const ex=settlement.exitSources?.[o.market];
       if(!ex||ex.source_sha256!==F.hash(ex.raw)||
         ex.source_sha256!==x.source_exit_sha256)reject('Missing independently recheckable exit quote');
       const expected=F.mature(o,ex.raw,ex.received_at_ms,x.recorded_at_ms);
       if(JSON.stringify(expected)!==JSON.stringify(x))reject('Later outcome changed since original evaluation');
     }else if(x.status==='NO_TRADE'){
       const expected=F.mature(o,null,null,x.recorded_at_ms);
       if(JSON.stringify(expected)!==JSON.stringify(x))reject('NO-TRADE label mutated');
     }else{
       if(x.paper_net_ex_funding!==null||x.paper_net_including_funding!==undefined)
         reject('Missing-data result cannot carry priced P&L');
     }
   }
 }
 const per={};
 for(const market of ['BTC','ETH','SOL'])per[market]={observations:0,no_trade:0,priced_reference_ex_funding:0,
   missing:0,pending:0,assumed_ex_funding_mean:null,
   fully_costed_profit_factor:null,profits_verified:false};
 const labels=new Map((settlement?.outcomes||[]).map(x=>[x.observation_id,x]));
 for(const o of capture.observations){
  const m=per[o.market];m.observations++;
  const x=labels.get(o.id);
  if(!x)m.pending++;
  else if(x.status==='NO_TRADE')m.no_trade++;
  else if(x.status==='PAPER_OUTCOME_WITH_FUNDING_UNKNOWN'){
    m.priced_reference_ex_funding++;
    if(!m._values)m._values=[];
    m._values.push(x.paper_net_ex_funding);
  }else m.missing++;
 }
 for(const v of Object.values(per)){
   const vals=v._values||[];
   if(vals.length)v.assumed_ex_funding_mean=vals.reduce((a,b)=>a+b,0)/vals.length;
   delete v._values;
 }
 return {schema:'mahoraga-v105-causal-outcomes-v1',
   markets:per,observations:audit.observations,source_gaps:audit.source_gaps,
   pending:audit.pending_labels,reconciled_paper_reference_quotes:audit.paper_ex_funding,
   independent_attestation_available:false,
   funding_reconciled:false,verified_full_execution_costs:false,
   eligibility_to_train:false,auto_model_update:false,live_orders:false,
   approved_for_live:false,profitability_verified:false,
   verdict:'RESEARCH_DIAGNOSTICS_ONLY'};
}
module.exports={reconcile};
