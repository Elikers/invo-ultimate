'use strict';
const assert=require('node:assert/strict'),X=require('./release.cjs');
const sample={'index.html':'same','v61-core.js':'same','research/run.cjs':'same',
 'research/v7-registration.json':'same','.github/workflows/research.yml':'same'};
const a=X.readiness({baselineFiles:sample,branchFiles:sample,
 feed:{stream_coverage_proven:false},models:{species:'EIGHT_SPECIALISTS_PLUS_META'},
 paired:{status:'RESEARCH_ONLY_NOT_PROMOTABLE',opportunities:100,blockers:['RETROSPECTIVE_EVIDENCE_ONLY']},
 forward:{eligible_v10_closed:0,per_group_min:0}});
assert.equal(a.readiness,'BLOCKED');
assert.equal(a.orders_enabled,false);
const full=X.readiness({baselineFiles:sample,branchFiles:sample,
 feed:{stream_coverage_proven:true,reconnect_recovery_tested:true,clock_integrity_verified:true,
 durable_external_storage_verified:true,gap_free_or_quarantined:true},
 models:{species:'EIGHT_SPECIALISTS_PLUS_META',immutable_checkpoints:true,
 trained_meta_out_of_expert_fit_period:true,scalping_labeled_with_1m_microstructure:true,champion_rollback_tested:true},
 paired:{status:'RESEARCH_ONLY_NOT_PROMOTABLE',opportunities:160,blockers:[]},
 forward:{eligible_v10_closed:160,per_group_min:30,correlation_controlled:true,
 all_costs_verified:true,human_signoff:true}});
assert.equal(full.readiness,'MANUAL_RELEASE_REVIEW_ONLY');
assert.equal(full.automatic_activation,false);
assert.equal(full.website_live_signals_enabled,false);
const altered={...sample,'index.html':'tampered'};
assert.ok(X.readiness({baselineFiles:sample,branchFiles:altered}).blockers.includes('PRODUCTION_BASELINE_MISMATCH'));
console.log('IMPROVEMENT 5 PASS: file identity, data/model/paired/forward gates, never-authorize activation');
