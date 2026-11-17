/* INVO v7.3: strict prospective-evidence classification, NO candidate promotion.
 * Historical candidate simulations and baseline-only forward paper trades cannot validate changed exits.
 */
'use strict';
const GATE='NO_INDEPENDENT_CANDIDATE_EVIDENCE';
function evaluate(reg,journal,experiments,now=new Date().toISOString()){
 if(reg?.schema!=='invo-v7.3-prospective-registration-1')throw Error('Invalid frozen candidate registration');
 if(journal?.schema!=='invo-v6.3-forward-1')throw Error('Invalid baseline journal');
 if(!Array.isArray(experiments)||experiments.length!==reg.preregistered_pairs.length)throw Error('Unexpected candidate experiments');
 const registered=Date.parse(reg.registered_utc);
 if(!Number.isFinite(registered)||Date.parse(now)<registered)throw Error('Registration is future-dated');
 const baseline=Object.values(journal.markets||{}).flatMap(m=>m.observations||[]);
 const overall=baseline.filter(x=>x.status==='CLOSED').length;
 const candidates=reg.preregistered_pairs.flatMap(p=>reg.candidates.map(c=>({
  coin:p.coin,strategy:p.strategy,candidate:c.id,
  prospective_candidate_closed:0,minimum_required:reg.minimums.closed_per_market_strategy_candidate,
  status:GATE,reason:'No separate candidate-specific immutable forward ledger; baseline observations and historical replay cannot substitute.'
 })));
 return {schema:'invo-v7.3-forward-gate-1',checked_utc:now,registered_utc:reg.registered_utc,
  baseline_forward_closed:overall,baseline_total_minimum:reg.minimums.closed_overall,
  baseline_evidence_status:overall>=reg.minimums.closed_overall?'BASELINE_EXPLORATORY_SAMPLE_MET_NOT_LIVE_VALIDATED':'BASELINE_SAMPLE_INSUFFICIENT',
  candidates,approved_candidates:0,permission_to_change_production:false,
  next_requirement:'Implement candidate-specific forward-only capture and risk validation under separate explicit future approval; none was constructed in this phase.',
  warning:'Registration is not prospective validation. No candidate-specific forward observations were captured or inferred from historical replays.'};
}
module.exports={evaluate,GATE};
