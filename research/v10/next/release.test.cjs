'use strict';const assert=require('node:assert/strict'),A=require('./release.cjs');
const x=A.audit({status:'BLOCKED',invalid:0},{},{});assert.equal(x.status,'BLOCKED');
assert.equal(x.website_active,false);assert.equal(x.live_orders_allowed,false);
assert.ok(x.blockers.includes('NO_SEPARATE_HUMAN_ACTIVATION_APPROVAL'));
const y=A.audit({status:'HUMAN_REVIEW_ONLY',invalid:0},{
 continuous_capture_verified:true,reconnect_and_clock_health_verified:true,durable_storage_verified:true,
 model_versions_frozen:true,rollback_rehearsed:true,quality_schema_verified:true,
 execution_costs_verified:true,drawdown_tail_review_passed:true,concentration_limits_reviewed:true,
 all_eight_specialists_validated:true},{explicit_human_website_activation:true});
assert.equal(y.status,'MANUAL_REVIEW_ONLY');assert.equal(y.website_active,false);
assert.equal(y.automatic_promotion,false);assert.equal(y.live_orders_allowed,false);
console.log('GATE 5 fail-closed even ideal evidence, no production mutation, manual-only review PASS');
