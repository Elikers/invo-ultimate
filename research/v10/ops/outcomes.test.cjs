'use strict';
const assert=require('node:assert/strict'),F=require('../forward/forward.cjs'),R=require('../forward/registration.json');
const V=require('./outcomes.cjs');
const t=F.START+600000;
function book(coin,time=t,buy=3,px=100){
 const bids=Array.from({length:10},(_,i)=>({px:String(px-i*.1),sz:String(buy)}));
 const asks=Array.from({length:10},(_,i)=>({px:String(px+.01+i*.1),sz:'1'}));
 return JSON.stringify({channel:'l2Book',data:{coin,time,levels:[bids,asks]}});
}
const raw=book('BTC'),obs=F.propose(raw,t,t);
assert.equal(obs.side,'LONG');
const capture={schema:'mahoraga-v103-capture-receipt-v1',run_id:'test-run',
  registration_sha256:F.hash(R),independent_external_attestation:false,
  live_orders:false,training_eligible:false,observations:[obs],
  gaps:['ETH','SOL'].map(m=>F.gap(m,t,'NO_BOOK'))};
const sources={BTC:{raw,source_sha256:F.hash(raw),received_at_ms:t}};
const first=V.reconcile(capture,sources,null);
assert.equal(first.pending,1);assert.equal(first.profitability_verified,false);
const m=t+F.HORIZON,exit=book('BTC',m,3,101),outcome=F.mature(obs,exit,m,m);
assert.equal(outcome.status,'PAPER_OUTCOME_WITH_FUNDING_UNKNOWN');
const settlement={source_capture_run_id:'test-run',
  source_receipt_sha256:F.hash(JSON.stringify(capture,null,2)+'\n'),
  independent_external_attestation:false,portfolio_profitability_verified:false,
  approved_for_live:false,no_live_orders:true,
  outcomes:[outcome],exitSources:{BTC:{raw:exit,received_at_ms:m,source_sha256:F.hash(exit)}}};
const good=V.reconcile(capture,sources,settlement);
assert.equal(good.pending,0);assert.equal(good.reconciled_paper_reference_quotes,1);
assert.equal(good.markets.BTC.priced_reference_ex_funding,1);
assert.equal(good.markets.BTC.fully_costed_profit_factor,null);
assert.equal(good.eligibility_to_train,false);
assert.throws(()=>V.reconcile(capture,sources,{...settlement,
 outcomes:[{...outcome,paper_net_ex_funding:outcome.paper_net_ex_funding+1}]}),/changed/);
assert.throws(()=>V.reconcile(capture,sources,{...settlement,
 exitSources:{BTC:{...settlement.exitSources.BTC,source_sha256:'a'.repeat(64)}}}),/exit quote/);
assert.throws(()=>V.reconcile(capture,sources,{...settlement,source_capture_run_id:'forged'}),/Unlinked/);
assert.throws(()=>V.reconcile(capture,sources,{...settlement,
 outcomes:[{...outcome,recorded_at_ms:m-100}]}),/Premature/);
console.log('MAHORAGA v10.5 causal maturity, source re-evaluation, missing funding, no invented profit PASS');
