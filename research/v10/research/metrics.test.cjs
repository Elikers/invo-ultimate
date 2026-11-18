'use strict';
const assert=require('node:assert/strict'),F=require('../forward/forward.cjs'),R=require('../forward/registration.json'),M=require('./metrics.cjs');
const z=M.summarize([]);assert.equal(z.paper_exit_labels,0);
assert.equal(z.hypothetical_profit_factor_ex_funding,null);
const t=F.START+10000;
const rec={schema:'mahoraga-v103-capture-receipt-v1',run_id:'12345678',
 registration_sha256:F.hash(R),live_orders:false,training_eligible:false,
 independent_external_attestation:false,observations:[],gaps:R.markets.map(x=>F.gap(x,t,'NO_FRESH_VALID_L2'))};
const m=M.summarize([{receipt:rec,sources:{}}]);assert.equal(m.source_gaps,3);
assert.equal(m.portfolio_profitability_verified,false);
assert.throws(()=>M.summarize([{receipt:rec,sources:{}},{receipt:rec,sources:{}}]),/duplicate/);
console.log('v10.7 audit-gated paper analytics; empty/gap handling; no verified profits PASS');
