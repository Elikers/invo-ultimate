'use strict';const assert=require('node:assert/strict'),A=require('./readiness.cjs');
const reg={sha256:'f'.repeat(64),start_ms:Date.parse('2026-11-19T00:00:00Z')};
const s=A.audit({registeredExperiment:reg});
assert.equal(s.status,'BLOCKED');assert.equal(s.production_trading_enabled,false);
assert.equal(s.model_promotion_enabled,false);
assert.ok(s.blockers.includes('FEED_NOT_OPERATIONALLY_VERIFIED'));
assert.equal(s.paired_summary.groups.length,8);
assert.throws(()=>A.audit({registeredExperiment:{sha256:'bad',start_ms:1}}),/Missing/);
console.log('MAHORAGA 11-12 independent paper matched-evidence and hard non-activation release PASS');
