'use strict';
const assert=require('node:assert/strict'),C=require('./challenger.cjs');
const now=Date.parse('2026-11-20T06:00:00Z');
const row={observation_id:'unit-test-external-0001',market:'BTC',side:'LONG',
 predicted_at_ms:Date.parse('2026-11-19T01:00:00Z'),
 matured_at_ms:Date.parse('2026-11-19T02:00:00Z'),
 net_including_funding:0.001,imbalance:.4,spread_bps:1,
 funding_reconciled:true,full_venue_costs_verified:true,
 source_integrity_verified:true,prediction_precommitted:true,
 external_anchor_verified:true,research_only:true,training_eligible:true};
const origin=C.empty(),defaultRun=C.safeTrain(origin,[row],now);
assert.equal(defaultRun.report.accepted,0);
assert.equal(defaultRun.report.blocked,1);
assert.equal(defaultRun.next.revision,0);
const verified=C.safeTrain(origin,[row],now,x=>x.observation_id.startsWith('unit-test-'));
assert.equal(verified.report.accepted,1);
assert.equal(verified.next.families.BTC.LONG.samples,1);
assert.equal(verified.next.families.BTC.LONG.posterior_win_probability,.6);
assert.equal(verified.report.champion_changed,false);
assert.equal(verified.report.auto_promotion,false);
assert.equal(verified.next.research_only,true);
assert.equal(C.safeTrain(verified.next,[row],now,()=>true).report.duplicates,1);
assert.equal(C.safeTrain(origin,[{...row,training_eligible:false}],now,()=>true).report.accepted,0);
assert.equal(C.safeTrain(origin,[{...row,full_venue_costs_verified:false}],now,()=>true).report.accepted,0);
assert.equal(C.safeTrain(origin,[{...row,matured_at_ms:now+1}],now,()=>true).report.accepted,0);
assert.equal(C.safeTrain(origin,[{...row,predicted_at_ms:Date.parse('2026-11-18T10:00:00Z')}],now,()=>true).report.accepted,0);
assert.equal(C.safeTrain(origin,[{...row,net_including_funding:NaN}],now,()=>true).report.accepted,0);
assert.throws(()=>C.safeTrain({...origin,auto_promotion:true},[],now),/research-only/);
console.log('MAHORAGA v10.6 default no verifier rejects samples; synthetic trust-gate training and no-promotion tests PASS');
