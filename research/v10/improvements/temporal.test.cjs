'use strict';const assert=require('node:assert/strict'),T=require('./temporal.cjs');
const base=t=>({expert:'fusion',market:'BTCUSDT',side:'LONG',predicted_at_ms:t,
 matured_at_ms:t+3600000,available_to_model_ms:t,win_label:1,net_paper_pct:.3,
 archive_sha256:'a'.repeat(64),label_source:'MATURED_FROZEN_PAPER_SIM',
 features:{trend:1,volatility:1,volume_ratio:2,spread_bps:0,order_imbalance:0,funding:0,open_interest_change:0}});
const train=base(Date.parse('2026-04-15T00:00:00Z'));
const m={};assert.equal(T.fitExperts([train],m).updated,1);
assert.ok(m.fusion.updates===1);
const june=base(Date.parse('2026-06-15T00:00:00Z'));
assert.throws(()=>T.fitExperts([june],m),/cross-split/);
const aug=base(Date.parse('2026-08-15T00:00:00Z'));const before=JSON.stringify(m.fusion);
const score=T.scoreFrozen([aug],m,'VALIDATE');
assert.equal(score.examples,1);assert.equal(score.independent_prospective,false);
assert.equal(JSON.stringify(m.fusion),before);
assert.throws(()=>T.scoreFrozen([train],m,'VALIDATE'),/Forbidden/);
assert.throws(()=>T.verifyRow({...train,matured_at_ms:Date.parse('2026-05-01T00:00:00Z')}),/split/);
assert.throws(()=>T.verifyRow({...train,available_to_model_ms:train.predicted_at_ms+1}),/provenance/);
console.log('IMPROVEMENT 2 PASS: April-May expert fitting, separate future meta/validation/audit, immutable frozen scoring');
