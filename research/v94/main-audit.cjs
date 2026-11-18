'use strict';const fs=require('node:fs'),{review}=require('./review.cjs');
const research=process.argv[2],production=process.argv[3];if(!research||!production)throw Error('Two separate checkouts required');
const read=(root,f)=>JSON.parse(fs.readFileSync(root+'/'+f,'utf8'));
const candidate=read(production,'research/v7-paper-summary.json');
const baseline=read(production,'research/forward-intelligence.json');
const registration=read(research,'research/v91/registration.json');
const report=review({registration_sha:null,forward_only:false,
 execution_fills_verified:false,costs_reconciled:false,
 correlation_adjusted:false,multiple_testing_adjusted:false,collector_gaps_resolved:false,
 groups:[{id:'JUP',closed:candidate.by_candidate?.CANDIDATE_SHORTER_TIME_EXIT?.closed||0,lower_ci_95_net_pct:null,max_drawdown_pct:null},
 {id:'SOL',closed:candidate.by_candidate?.CANDIDATE_TIGHTER_STOP?.closed||0,lower_ci_95_net_pct:null,max_drawdown_pct:null}]},registration);
console.log(JSON.stringify({baseline_forward_closed:baseline.aggregate.closed,existing_v7_candidate_closed:candidate.closed,
 v9_new_candidate_closed:0,v9_registration_future_start:registration.not_before_utc,
 review:report,warning:'v7 legacy candidate ledger is NOT an independent forward result for newly preregistered v9 candidates.'},null,2));
