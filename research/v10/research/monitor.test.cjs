'use strict';
const assert=require('node:assert/strict'),F=require('../forward/forward.cjs'),R=require('../forward/registration.json'),L=require('./ledger.cjs'),M=require('./monitor.cjs');
const t=F.START+100000;
const missing=M.inspect(t,null,null);assert.equal(missing.status,'FAIL_CLOSED');
assert(missing.reasons.includes('NO_DURABLE_LEDGER'));
const r={schema:'mahoraga-v103-capture-receipt-v1',run_id:'12345678',
 registration_sha256:F.hash(R),live_orders:false,training_eligible:false,
 independent_external_attestation:false,observations:[],gaps:R.markets.map(x=>F.gap(x,t,'MISSING'))};
r.ended_at_ms=t;
const l=L.append(null,r,{},'12345678');
const bad=M.inspect(t,l,r);assert.equal(bad.status,'FAIL_CLOSED');
assert(bad.reasons.includes('MARKET_COVERAGE_GAP'));
assert.equal(bad.collection_scheduler_verified,false);
const old=M.inspect(t+2*3600000,l,r);assert(old.reasons.includes('STALE_OR_FUTURE_RECEIPT'));
const before=M.inspect(F.START-1,null,null);
assert(before.reasons.includes('REGISTRATION_NOT_ACTIVE'));
console.log('v10.8 operational gate: prestart, gaps, stale, missing storage FAIL CLOSED PASS');
