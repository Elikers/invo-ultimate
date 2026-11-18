'use strict';
const assert=require('node:assert/strict'),F=require('../forward/forward.cjs'),R=require('../forward/registration.json'),C=require('./causal.cjs');
const t=F.START+100000;
const levels=(bid,ask)=>[
 Array.from({length:10},(_,i)=>({px:String(bid-i*.01),sz:'5'})),
 Array.from({length:10},(_,i)=>({px:String(ask+i*.01),sz:'1'}))];
const raw=(time,bid,ask)=>JSON.stringify({channel:'l2Book',data:{coin:'BTC',time,levels:levels(bid,ask)}});
const entry=raw(t,100,100.01),o=F.propose(entry,t,t);
const capture={schema:'mahoraga-v103-capture-receipt-v1',run_id:'12345678',
 registration_sha256:F.hash(R),live_orders:false,training_eligible:false,
 independent_external_attestation:false,observations:[o],
 gaps:R.markets.filter(x=>x!=='BTC').map(x=>F.gap(x,t,'NO_FRESH_VALID_L2'))};
const sources={BTC:{raw:entry,received_at_ms:t,source_sha256:F.hash(entry)}};
const exit=raw(o.mature_after_ms,101,101.01),at=o.mature_after_ms;
const x=F.mature(o,exit,at,at);
assert.equal(x.status,'PAPER_OUTCOME_WITH_FUNDING_UNKNOWN');
const group={source_receipt_sha256:F.hash(JSON.stringify(capture,null,2)+'\n'),
 independent_external_attestation:false,portfolio_profitability_verified:false,
 approved_for_live:false,no_live_orders:true,outcomes:[x],
 exitSources:{BTC:{raw:exit,received_at_ms:at,source_sha256:F.hash(exit)}}};
const z=C.evaluate(capture,sources,group);
assert.equal(z.verified_matured_paper_labels,1);assert.equal(z.funded_net_profitability_verified,false);
assert.throws(()=>C.evaluate(capture,sources,{...group,exitSources:{BTC:{...group.exitSources.BTC,raw:'{}'}}}),/hash mismatch/);
assert.throws(()=>C.evaluate(capture,sources,{...group,outcomes:[{...x,paper_net_ex_funding:x.paper_net_ex_funding+1}]}),/cost mismatch/);
assert.throws(()=>C.evaluate(capture,sources,{...group,outcomes:[{...x,recorded_at_ms:t}]}),/Premature/);
console.log('v10.5 synthetic fixtures: causal entry/exit, cost, tamper, early-label rejection PASS');
