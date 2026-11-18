'use strict';
const assert=require('node:assert/strict'),G=require('./challenger.cjs');
const g=G.gate([]);assert.equal(g.candidate_research_screen_passed,false);
assert.equal(g.eligible_samples,0);assert.equal(g.champion_changed,false);
assert.equal(g.approved_for_live,false);
const v=G.gate([{capture_run_id:'12345678',matured:true,verified_provenance:true,
 training_eligible:false,funding_verified:false,independently_attested:false,
 actual_fills_verified:false,net_return:9999}]);
assert.equal(v.eligible_samples,0);assert.equal(v.net_return_sum,null);
assert.throws(()=>G.gate([{capture_run_id:'1'},{capture_run_id:'1'}]),/Duplicate/);
assert.throws(()=>G.gate([{capture_run_id:null}]),/identity/);
console.log('v10.6 research-only challenger: no automatic learning, funding/fill gates, nonpromotion PASS');
