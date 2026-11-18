'use strict';
const assert=require('node:assert/strict'),M=require('./monitor.cjs');
const early=Date.parse('2026-11-18T12:00:00Z');
const base=M.assess(early);
assert.equal(base.status,'RESEARCH_BLOCKED');
assert.ok(base.notes.includes('PRE_REGISTRATION_NO_PROSPECTIVE_EVIDENCE_EXPECTED'));
assert.ok(base.flags.some(x=>x.code==='RECURRING_COLLECTOR_NOT_DEPLOYED'));
assert.ok(base.flags.some(x=>x.code==='INDEPENDENT_OFFSITE_BACKUP_NOT_VERIFIED'));
const start=Date.parse('2026-11-19T00:00:00Z');
const later=M.assess(start+24*3600000);
assert.ok(later.flags.some(x=>x.code==='NO_REGISTERED_FORWARD_OBSERVATIONS'));
const record={observations:[{id:'registered-id',decision_time_ms:start+5000,
 mature_after_ms:start+3605000}],gaps:[],live_orders:false,training_eligible:false,
 independent_external_attestation:false};
const expired=M.assess(start+8*3600000,[record]);
assert.ok(expired.flags.some(x=>x.code==='STALE_FORWARD_OBSERVATIONS'));
assert.ok(expired.flags.some(x=>x.code==='UNMATCHED_MATURED_OBSERVATION'));
const bad=M.assess(early,[{...record,live_orders:true}], [{id:8,conclusion:'failure'}],
 {unsupported_profit_claim:true,production_changed:true});
for(const name of ['UNTRUSTED_CAPTURE_RECEIPT','WORKFLOW_FAILED',
  'UNSUPPORTED_PROFITABILITY_CLAIM','UNAUTHORIZED_PRODUCTION_CHANGE'])
 assert.ok(bad.flags.some(x=>x.code===name));
assert.equal(bad.trading_enabled,false);
assert.equal(bad.automatic_promotion,false);
console.log('MAHORAGA v10.8 collector schedule, backup, stale outcomes, failed runs, forbidden profits and no-live guards PASS');
