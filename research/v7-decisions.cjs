/* INVO v7.4 — evidence-gated profitability decision, read-only.
 * Never authorizes orders, strategy promotion, or changes to the frozen v6.9 engine.
 */
'use strict';
function decide(loss,robustness,forward,experiments,registration,now=new Date().toISOString()){
 if(loss?.schema!=='invo-v7.0-loss-attribution-1'||robustness?.schema!=='invo-v7.2-robustness-1'||
   forward?.schema!=='invo-v7.3-forward-gate-1'||registration?.schema!=='invo-v7.3-prospective-registration-1')
  throw Error('Missing verified phase evidence');
 if(!Array.isArray(experiments)||experiments.length!==2||robustness.tested_candidates!==6)throw Error('Research budget mismatch');
 const screens=robustness.rows||[];
 if(screens.length!==6)throw Error('Incomplete robustness evidence');
 const positiveCost16=screens.filter(x=>typeof x.net_16bps_pct==='number'&&x.net_16bps_pct>0).length;
 const allCandidateGroupCountsMet=forward.candidates.length>0&&forward.candidates.every(x=>x.prospective_candidate_closed>=x.minimum_required);
 const blockers=[];
 if(loss.closed<registration.minimums.closed_overall)blockers.push('BASELINE_FORWARD_SAMPLE_BELOW_100');
 if(!allCandidateGroupCountsMet)blockers.push('CANDIDATE_FORWARD_GROUP_SAMPLE_BELOW_30');
 if(robustness.historical_screen_count!==screens.length)blockers.push('SOME_RETROSPECTIVE_STRESS_SCREENS_FAILED');
 if(positiveCost16!==screens.length)blockers.push('SOME_16BPS_HISTORICAL_SCENARIOS_NONPOSITIVE');
 blockers.push('NO_REAL_EXCHANGE_EXECUTION_VALIDATION');
 blockers.push('HISTORICAL_SELECTION_NOT_INDEPENDENT');
 return {schema:'invo-v7.4-decision-1',created_utc:now,production_version:'v6.9',
  decision:'KEEP_PRODUCTION_FROZEN_NO_CANDIDATE_PROMOTION',
  approved_candidate_count:0,permission_to_change_production:false,
  evidence:{forward_baseline_closed:loss.closed,minimum_forward_total:registration.minimums.closed_overall,
   historical_candidate_scenarios:screens.length,historical_screen_passed:robustness.historical_screen_count,
   positive_net_at_16bps_scenarios:positiveCost16,
   candidate_forward_paper_captured:forward.experimental_captured||0,
   candidate_forward_group_counts_met:allCandidateGroupCountsMet},
  blockers,steps:[
   'Continue prospective capture of the existing baseline and separate registered candidate paper journal, without fabricating missed signals.',
   'Do not tune variants against repeatedly inspected historical folds; use a future untouched period for any subsequent independent evaluation.',
   'Recheck realistic spread, exchange fees, funding, latency and downside risk before considering any separate approval.',
   'Do not call a profitable historical variation a live profitable engine.'
  ],
  warning:'This research gate can recommend keeping production frozen; it cannot authorize financial trading or promise profits.'};
}
module.exports={decide};
