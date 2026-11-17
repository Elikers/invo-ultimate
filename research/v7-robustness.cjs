/* INVO v7.2: predeclared stress and chronology checks on already observed history.
 * Diagnostic only; previously viewed data cannot become an independent holdout.
 */
'use strict';
const REQUIRED_COSTS=['8','16','24'],MIN_FOLD=20;
function inspect(experiments){
 if(!Array.isArray(experiments)||experiments.length!==2)throw Error('Expected exactly two preregistered pairs');
 const rows=[];
 for(const pair of experiments){
  if(!Array.isArray(pair.candidates)||pair.candidates.length!==3)throw Error('Unapproved candidate count');
  for(const candidate of pair.candidates){
   const c=candidate.by_cost_bps;
   if(REQUIRED_COSTS.some(k=>!c?.[k]?.full||!Array.isArray(c[k].folds)||c[k].folds.length!==3))throw Error('Missing fixed cost/fold scenario');
   const net8=c['8'].full.expectancyPct,net16=c['16'].full.expectancyPct,net24=c['24'].full.expectancyPct;
   const folds=c['16'].folds;const enough=folds.every(f=>f.count>=MIN_FOLD);
   const positiveAll=folds.every(f=>f.expectancyPct!==null&&f.expectancyPct>0&&f.profitFactor!==null&&f.profitFactor>1);
   const costPositive=[net8,net16,net24].every(x=>x!==null&&x>0);
   const robust=enough&&positiveAll&&costPositive;
   rows.push({market:pair.coin,strategy:pair.strategy,candidate:candidate.id,count:candidate.trade_count,
    net_8bps_pct:net8,net_16bps_pct:net16,net_24bps_pct:net24,
    last_25pct_count:folds[2].count,last_25pct_net_16bps_pct:folds[2].expectancyPct,
    enough_per_fold:enough,positive_all_three_folds_at_16bps:positiveAll,
    positive_all_three_cost_scenarios:costPositive,
    retrospective_stress_screen:robust?'HISTORICAL_SCREEN_ONLY':'REJECT_RETROSPECTIVE_SCREEN',
    independent_validation:'NOT_INDEPENDENT_PREVIOUSLY_INSPECTED_HISTORY'});
  }
 }
 return {schema:'invo-v7.2-robustness-1',checked_utc:new Date().toISOString(),tested_candidates:rows.length,
  historical_screen_count:rows.filter(x=>x.retrospective_stress_screen==='HISTORICAL_SCREEN_ONLY').length,rows,
  warning:'Screening is conservative but remains non-independent and subject to snooping. No statistical significance or live edge is claimed.'};
}
module.exports={inspect,MIN_FOLD};
