'use strict';
// Read-only check of production snapshot, separate from the new research scripts.
const fs=require('node:fs'),{judge}=require('./release.cjs');
const root=process.argv[2];if(!root)throw Error('Production snapshot required');
const f=JSON.parse(fs.readFileSync(root+'/research/forward-intelligence.json','utf8'));
const c=JSON.parse(fs.readFileSync(root+'/research/v7-paper-summary.json','utf8'));
const registration=JSON.parse(fs.readFileSync(root+'/research/v7-registration.json','utf8'));
const validRegistration=registration.schema==='invo-v7.3-prospective-registration-1'&&
 Number.isFinite(Date.parse(registration.registered_utc))&&
 Date.parse(registration.registered_utc)<=Date.parse(c.updated_utc);
const n=f.aggregate?.closed,shadow=c.closed;
if(!Number.isInteger(n)||!Number.isInteger(shadow))throw Error('Missing verified forward counts');
const result=judge({forward_closed:shadow,market_groups:[{market:'JUP',closed:c.by_candidate?.CANDIDATE_SHORTER_TIME_EXIT?.closed||0},
 {market:'SOL',closed:c.by_candidate?.CANDIDATE_TIGHTER_STOP?.closed||0}],
 preregistered:validRegistration,independent_forward_period:false,realistic_costs_verified:false,
 no_missing_data_gaps:false,lower_95_pct:null,max_drawdown_pct:null,multiple_testing_controlled:false});
if(result.production_promotion_allowed)throw Error('Fail-closed promise broken');
console.log(JSON.stringify({main_forward_baseline_closed:n,main_shadow_candidate_closed:shadow,
 candidate_review_status:result.research_review_status,registration_present:validRegistration,failed_gates:result.failed_gates,
 production_change:false,not_forward_reconstructed:true},null,2));
