'use strict';
const fs=require('node:fs'),E=require('./evaluate.cjs'),R=require('../learners/registration.json');
const path=process.argv[2];if(!path)throw Error('Required separate main-branch journal path');
const snapshot=JSON.parse(fs.readFileSync(path,'utf8'));
const legacy=E.mainSnapshot(snapshot,R);
const report=E.evaluate({forward_trade_count:0,groups:R.experts.map(id=>({id,closed:0,lower_bound_95_net_pct:null})),
 holdout_registration_immutable:false,matched_forward_baselines:false,costs_verified:false,
 execution_fills_verified:false,clustering_and_multiplicity_adjusted:false,
 drawdown_and_tails_reviewed:false,data_gap_audit_passed:false,all_models_frozen_before_test:false});
console.log(JSON.stringify({source:'ACTUAL_MAIN_READ_ONLY_LEGACY_JOURNAL',legacy,mahoraga:report},null,2));
if(report.status!=='BLOCKED')throw Error('Unsafe false-ready result');
