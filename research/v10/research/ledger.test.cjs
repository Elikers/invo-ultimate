'use strict';
const assert=require('node:assert/strict'),F=require('../forward/forward.cjs'),R=require('../forward/registration.json'),L=require('./ledger.cjs');
const now=F.START+10000;
const r={schema:'mahoraga-v103-capture-receipt-v1',run_id:'12345678',
 registration_sha256:F.hash(R),live_orders:false,training_eligible:false,
 independent_external_attestation:false,observations:[],
 gaps:R.markets.map(x=>F.gap(x,now,'NO_FRESH_VALID_L2'))};
const l=L.append(null,r,{},'12345678');assert.equal(L.verify(l),true);
assert.equal(l.entries[0].observations,0);
assert.throws(()=>L.append(l,r,{},'12345678'),/Duplicate/);
assert.throws(()=>L.verify({...l,entries:[{...l.entries[0],missing:99}]}),/Tampered/);
assert.throws(()=>L.append(null,{...r,gaps:[]},{},'12345678'),/Missing observed/);
console.log('v10.4 ledger chain, no fabricated sample, duplicate and tamper rejection PASS');
