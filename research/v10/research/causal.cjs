'use strict';
// Cross-check independently received maturity frame against the preregistered pure evaluator.
// No orders, no fabricated funding, no use of later prices as entry evidence.
const F=require('../forward/forward.cjs'),A=require('../forward/audit.cjs'),R=require('../forward/registration.json');
function ok(x,m){if(!x)throw Error(m)}
function evaluate(receipt,sources,outcome){
 const summary=A.audit(receipt,sources,outcome?[outcome]:[]);
 if(!outcome)return {...summary,verified_matured_paper_labels:0,unverified_exit_frames:0,
  funded_net_profitability_verified:false};
 const byId=new Map(receipt.observations.map(o=>[o.id,o]));
 let checked=0,unverified=0;
 for(const x of outcome.outcomes){
  const obs=byId.get(x.observation_id);ok(obs,'Unknown observation');
  if(x.status==='NO_TRADE'){
   const expected=F.mature(obs,null,null,x.recorded_at_ms);
   ok(expected.status===x.status,'Inconsistent abstention');checked++;continue;
  }
  if(x.status!=='PAPER_OUTCOME_WITH_FUNDING_UNKNOWN'){unverified++;continue}
  const s=outcome.exitSources?.[obs.market];
  ok(s&&s.source_sha256===F.hash(s.raw)&&s.source_sha256===x.source_exit_sha256,
   'Exit raw frame missing or hash mismatch');
  const expected=F.mature(obs,s.raw,s.received_at_ms,x.recorded_at_ms);
  ok(expected.status===x.status&&expected.source_exit_time_ms===x.source_exit_time_ms&&
    expected.gross_reference_return===x.gross_reference_return&&
    expected.assumed_execution_cost_return===x.assumed_execution_cost_return&&
    expected.paper_net_ex_funding===x.paper_net_ex_funding,
   'Matured price or assumed cost mismatch');
  ok(x.paper_net_including_funding===null&&x.profitability_verified===false,
   'Funding or fill falsely certified');
  checked++;
 }
 return {...summary,verified_matured_paper_labels:checked,unverified_exit_frames:unverified,
   funded_net_profitability_verified:false,live_order_evidence:0,
   verdict:'RESEARCH_PAPER_OUTCOMES_ONLY'};
}
module.exports={evaluate};
