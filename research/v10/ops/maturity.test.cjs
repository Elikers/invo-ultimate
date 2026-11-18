'use strict';
const assert=require('node:assert/strict'),M=require('./maturity.cjs');
const F=require('../forward/forward.cjs'),R=require('../forward/registration.json');
const t=F.START+10000;
function book(coin='BTC',at=t,buy=3,price=100){
 const bids=Array.from({length:10},(_,i)=>({px:String(price-i*.1),sz:String(buy)}));
 const asks=Array.from({length:10},(_,i)=>({px:String(price+.01+i*.1),sz:'1'}));
 return JSON.stringify({channel:'l2Book',data:{coin,time:at,levels:[bids,asks]}});
}
function capture(raw,now=t,run='12345678'){
 const o=F.propose(raw,now,now);
 const gaps=R.markets.filter(x=>x!==o.market).map(x=>F.gap(x,now,'RESEARCH_GAP'));
 return {receipt:{schema:'mahoraga-v103-capture-receipt-v1',run_id:run,
    registration_sha256:F.hash(R),observations:[o],gaps,
    training_eligible:false,independent_external_attestation:false,live_orders:false},
   frames:{[o.market]:{raw,source_sha256:F.hash(raw),received_at_ms:now}},o};
}
const c=capture(book());assert.equal(c.o.side,'LONG');
const m=c.o.mature_after_ms,expiry=m+R.exit_tolerance_ms;
const x=M.init(c.receipt,c.frames);
assert.equal(M.ingest(x,book('BTC',m-1000),m-1000,m-1000).status,'PREMATURE_QUOTE_REJECTED');
assert.equal(M.ingest(x,book('ETH',m),m,m).status,'UNREGISTERED_OR_GAP_MARKET');
assert.equal(M.ingest(x,book('BTC',m-9000),m,m).status,'REJECT_INVALID_OR_STALE_SOURCE');
assert.equal(M.ingest(x,book('BTC',m),m,m).status,'CAUSAL_PAPER_QUOTE_ACCEPTED');
assert.equal(M.ingest(x,book('BTC',m),m,m).status,'DUPLICATE_IGNORED');
const r=M.finalize(x,m,'MATCHED_LIVE_RECEIPT');
assert.equal(r.audit.matched_labels,1);
assert.equal(r.audit.paper_ex_funding,1);
assert.equal(r.result.outcomes[0].paper_net_including_funding,null);
assert.equal(r.result.approved_for_live,false);
assert.throws(()=>M.finalize(x,m),/Already/);
const missing=M.init(c.receipt,c.frames);
assert.throws(()=>M.finalize(missing,m),/complete exit tolerance/);
const late=M.ingest(missing,book('BTC',expiry+1),expiry+1,expiry+1);
assert.equal(late.status,'LATE_QUOTE_REJECTED');
const lost=M.finalize(missing,expiry+1,'DISCONNECTED_AND_WINDOW_EXPIRED');
assert.equal(lost.audit.missing_data_labels,1);
assert.equal(lost.result.outcomes[0].paper_net_ex_funding,null);
const noneRaw=book('BTC',t,1);
const n=capture(noneRaw);assert.equal(n.o.side,'NONE');
const abstain=M.init(n.receipt,n.frames);
assert.throws(()=>M.finalize(abstain,t),/before maturity/);
const a=M.finalize(abstain,n.o.mature_after_ms);
assert.equal(a.audit.abstentions_labeled,1);
const empty={...c.receipt,observations:[],gaps:R.markets.map(x=>F.gap(x,t,'NOT_REGISTERED'))};
const e=M.finalize(M.init(empty,{}),t);
assert.equal(e.audit.matched_labels,0);assert.equal(e.audit.pending_labels,0);
assert.throws(()=>M.init(c.receipt,{...c.frames,BTC:{...c.frames.BTC,source_sha256:'f'.repeat(64)}}),/provenance/);
console.log('MAHORAGA v10.9 same-run quote timing, retry-safe causal labels, NO-TRADE, missing-data and integrity tests PASS');
