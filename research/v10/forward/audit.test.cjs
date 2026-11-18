'use strict';
const assert=require('node:assert/strict'),F=require('./forward.cjs'),A=require('./audit.cjs'),R=require('./registration.json');
const now=F.START+200000;
function book(coin='BTC'){
 const bids=Array.from({length:10},(_,i)=>({px:String(100-i*.1),sz:'4'}));
 const asks=Array.from({length:10},(_,i)=>({px:String(100.01+i*.1),sz:'1'}));
 return JSON.stringify({channel:'l2Book',data:{coin,time:now,levels:[bids,asks]}});
}
const raw=book(),prediction=F.propose(raw,now,now);
const sources={BTC:{raw,received_at_ms:now,source_sha256:F.hash(raw)}};
const capture={schema:'mahoraga-v103-capture-receipt-v1',run_id:'unit-test',
 registration_sha256:F.hash(R),live_orders:false,training_eligible:false,
 independent_external_attestation:false,observations:[prediction],
 gaps:[F.gap('ETH',now,'NO_FRESH_VALID_L2'),F.gap('SOL',now,'NO_FRESH_VALID_L2')]};
const a=A.audit(capture,sources);
assert.equal(a.observations,1);assert.equal(a.source_gaps,2);assert.equal(a.pending_labels,1);
assert.equal(a.training_eligible_samples,0);assert.equal(a.approved_for_live,false);
assert.throws(()=>A.audit({...capture,observations:[prediction,prediction]},sources),/Duplicate/);
assert.throws(()=>A.audit(capture,{BTC:{...sources.BTC,source_sha256:'0'.repeat(64)}}),/provenance/);
assert.throws(()=>A.audit({...capture,gaps:[]},sources),/Missing observed/);
const noTradeObs=F.propose(JSON.stringify({...JSON.parse(book('BTC')),data:{...JSON.parse(book('BTC')).data,
 levels:[Array.from({length:10},(_,i)=>({px:String(100-i*.1),sz:'1'})),
         Array.from({length:10},(_,i)=>({px:String(100.01+i*.1),sz:'1'}))]}}),now,now);
const noneSourceRaw=JSON.stringify({...JSON.parse(book('BTC')),data:{...JSON.parse(book('BTC')).data,
 levels:[Array.from({length:10},(_,i)=>({px:String(100-i*.1),sz:'1'})),
         Array.from({length:10},(_,i)=>({px:String(100.01+i*.1),sz:'1'}))]}});
const abstain=F.propose(noneSourceRaw,now,now);
assert.equal(abstain.side,'NONE');
const noCapture={...capture,observations:[abstain]};
const noSources={BTC:{raw:noneSourceRaw,source_sha256:F.hash(noneSourceRaw),received_at_ms:now}};
const noLabel=F.mature(abstain,null,null,abstain.mature_after_ms);
const outcomeGroup={source_receipt_sha256:'a'.repeat(64),
 independent_external_attestation:false,portfolio_profitability_verified:false,
 approved_for_live:false,no_live_orders:true,outcomes:[noLabel]};
const b=A.audit(noCapture,noSources,[outcomeGroup]);
assert.equal(b.abstentions_labeled,1);assert.equal(b.pending_labels,0);assert.equal(b.profitability_verified,false);
assert.throws(()=>A.audit(noCapture,noSources,[outcomeGroup,outcomeGroup]),/duplicated/);
assert.throws(()=>A.audit(noCapture,noSources,[{...outcomeGroup,outcomes:[{...noLabel,
 recorded_at_ms:now}]}]),/Premature/);
console.log('MAHORAGA v10.3 forward auditor: provenance, gap, early maturity, duplicates, nonpromotion PASS');
