/* INVO v7.3: immutable candidate-specific forward evidence gating.
 * Never counts historical candidate backtests or baseline-only journal entries.
 * Even meeting sample thresholds NEVER authorizes strategy promotion/orders.
 */
'use strict';
const GATE='NO_INDEPENDENT_CANDIDATE_EVIDENCE';
function evaluate(reg,journal,experiments,now=new Date().toISOString(),candidateJournal=null){
 if(reg?.schema!=='invo-v7.3-prospective-registration-1')throw Error('Invalid frozen candidate registration');
 if(journal?.schema!=='invo-v6.3-forward-1')throw Error('Invalid baseline journal');
 if(!Array.isArray(experiments)||experiments.length!==reg.preregistered_pairs.length)throw Error('Unexpected candidate experiments');
 const registered=Date.parse(reg.registered_utc);
 if(!Number.isFinite(registered)||Date.parse(now)<registered)throw Error('Registration is future-dated');
 if(candidateJournal&&(candidateJournal.schema!=='invo-v7.3-candidate-paper-1'||candidateJournal.registered_utc!==reg.registered_utc))throw Error('Candidate paper ledger provenance mismatch');
 const baseline=Object.values(journal.markets||{}).flatMap(m=>m.observations||[]);
 const overall=baseline.filter(x=>x.status==='CLOSED').length;
 let totalCaptured=0;
 const candidates=reg.preregistered_pairs.flatMap(p=>reg.candidates.map(c=>{
  const rows=(candidateJournal?.markets?.[p.coin]?.observations||[]).filter(x=>x.variant===c.id&&x.strategy===p.strategy);
  const unique=new Set();
  for(const x of rows){
   if(x.coin!==p.coin||x.model!=='EXPERIMENTAL_DELAYED_PAPER_ONLY'||Date.parse(x.observed_at_utc)<registered||
      !Number.isFinite(Date.parse(x.observed_at_utc))||typeof x.id!=='string'||unique.has(x.id))throw Error('Candidate forward provenance invalid');
   unique.add(x.id);
  }
  totalCaptured+=rows.length;
  const closed=rows.filter(x=>x.status==='CLOSED');
  const net16=closed.map(x=>x.net_pct?.['16']);
  if(net16.some(x=>typeof x!=='number'||!Number.isFinite(x)))throw Error('Missing candidate net paper cost accounting');
  const sufficient=closed.length>=reg.minimums.closed_per_market_strategy_candidate;
  return {coin:p.coin,strategy:p.strategy,candidate:c.id,prospective_candidate_captured:rows.length,
   prospective_candidate_closed:closed.length,minimum_required:reg.minimums.closed_per_market_strategy_candidate,
   mean_net_16bps_pct:closed.length?net16.reduce((a,b)=>a+b,0)/closed.length:null,
   status:!rows.length?GATE:!sufficient?'FRESH_CANDIDATE_PAPER_SAMPLE_INSUFFICIENT':'EXPLORATORY_PAPER_COUNT_THRESHOLD_MET',
   reason:'Separate candidate forward-only paper data; correlated variants share signals. No real fills, funding or independent live validation.'};
 }));
 return {schema:'invo-v7.3-forward-gate-1',checked_utc:now,registered_utc:reg.registered_utc,
  baseline_forward_closed:overall,baseline_total_minimum:reg.minimums.closed_overall,
  baseline_evidence_status:overall>=reg.minimums.closed_overall?'BASELINE_EXPLORATORY_SAMPLE_MET_NOT_LIVE_VALIDATED':'BASELINE_SAMPLE_INSUFFICIENT',
  experimental_journal_available:!!candidateJournal,experimental_captured:totalCaptured,
  candidates,approved_candidates:0,permission_to_change_production:false,
  next_requirement:'Collect and independently review adequate genuinely captured, candidate-specific forward paper observations; production changes require separate explicit approval.',
  warning:'Historical candidate backtests NEVER count as forward evidence; even positive paper mean or a sample threshold is not live profitability proof.'};
}
module.exports={evaluate,GATE};
