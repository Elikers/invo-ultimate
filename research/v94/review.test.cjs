'use strict';const assert=require('node:assert/strict'),{review}=require('./review.cjs');
const reg={schema:'invo-v9.1-immutable-candidate-plan-1',committed_sha:'a'.repeat(40)};
const ok={registration_sha:'a'.repeat(40),forward_only:true,execution_fills_verified:true,
 costs_reconciled:true,correlation_adjusted:true,multiple_testing_adjusted:true,
 collector_gaps_resolved:true,groups:[{id:'BTC',closed:120,lower_ci_95_net_pct:.02,max_drawdown_pct:10}]};
const r=review(ok,reg);assert.equal(r.outcome,'INDEPENDENT_HUMAN_AUDIT_REQUIRED');
assert.equal(r.production_promotion,false);assert.equal(r.real_money_trading,false);
const fail=review({...ok,groups:[{id:'BTC',closed:19,lower_ci_95_net_pct:-.01,max_drawdown_pct:35}]},reg);
assert.equal(fail.outcome,'INSUFFICIENT_OR_NEGATIVE_EVIDENCE');
assert.ok(fail.blockers.includes('TOTAL_UNDER_100'));
assert.ok(review({...ok,registration_sha:'b'.repeat(40)},reg).blockers.includes('REGISTRATION_COMMIT_NOT_VERIFIED'));
assert.throws(()=>review({...ok,groups:[{id:'BTC',closed:-1}]},reg),/Invalid group/);
console.log('v9.4 immutable independent candidate release review PASS');
