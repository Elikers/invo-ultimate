'use strict';
const assert=require('node:assert/strict');
const {envelope,validateSequence,modelEligible,stableHash}=require('./provenance.cjs');
const t=Date.parse('2026-11-18T03:00:00Z'),source={venue:'hyperliquid',feed:'l2Book',venue_symbol:'BTC',instrument_type:'PERPETUAL'};
function ev({kind='BOOK_SNAPSHOT',at=t,recv=t+50,mono=1,id='btc-1',epoch=0,seq=null,snapshot=true}={}){
 return envelope({kind,market:'BTC',source,sourceEventMs:at,receivedWallMs:recv,
  receivedMonotonicMs:mono,raw:'{"levels":[]}',rawRef:'storage/raw/1',
  collectorRunId:'run-001',messageId:id,reconnectEpoch:epoch,snapshot,sequence:seq,
  sourceDocumentUrl:'https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions',
  payload:{bids:[],asks:[]}});
}
let state={};
let a=ev();let r=validateSequence(state,a);
assert.equal(r.status,'RESEARCH_ACCEPTED_NOT_TRAINING_APPROVED');
assert.equal(a.use.training_eligible,false);
assert.equal(validateSequence(state,ev()).status,'DUPLICATE_DROPPED');
assert.equal(Object.keys(state).length,1);
let delayed=ev({at:t+1000,recv:t+12000,mono:2,id:'delayed',snapshot:false});
assert.equal(validateSequence(state,delayed).status,'QUARANTINED');
assert.equal(delayed.use.reason,'STALE_RECEIPT');
let late=ev({at:t-1000,recv:t+13000,mono:3,id:'late',snapshot:false});
assert.equal(validateSequence(state,late).status,'LATE_EVENT_QUARANTINED');
let reconnect=ev({at:t+2000,recv:t+2050,mono:4,id:'reconnect',epoch:1,snapshot:true});
assert.equal(validateSequence(state,reconnect).status,'RESEARCH_ACCEPTED_NOT_TRAINING_APPROVED');
assert.throws(()=>validateSequence(state,ev({at:t+3000,recv:t+3100,mono:5,id:'no-snapshot',epoch:2,snapshot:false})),/snapshot/);
let seq1=ev({at:t+3000,recv:t+3050,mono:5,id:'seq1',epoch:1,seq:7,snapshot:true});
assert.equal(validateSequence(state,seq1).status,'RESEARCH_ACCEPTED_NOT_TRAINING_APPROVED');
let seqGap=ev({at:t+4000,recv:t+4050,mono:6,id:'gap',epoch:1,seq:9,snapshot:false});
assert.equal(validateSequence(state,seqGap).status,'QUARANTINED');
assert.equal(seqGap.use.reason,'UNTRUSTED_CAPTURE_GAP');
assert.equal(modelEligible(seqGap,{raw_payload_hash_verified:true,timestamp_audited:true,source_schema_checked:true,split_locked:true,
 cutoff_ms:t+5000,purpose:'TRAIN',segmentation:'REGISTERED_TRAIN_ONLY'}),false);
const review={raw_payload_hash_verified:true,timestamp_audited:true,source_schema_checked:true,split_locked:true,
 cutoff_ms:t+100000,purpose:'TRAIN',segmentation:'REGISTERED_TRAIN_ONLY'};
assert.equal(modelEligible(reconnect,review),true);
assert.equal(modelEligible(reconnect,{...review,purpose:'TEST'}),false);
assert.equal(modelEligible(reconnect,{...review,cutoff_ms:t+1000}),false);
let skew=ev({at:t+8000,recv:t+5000,mono:10,id:'skew'});
assert.equal(skew.use.reason,'CLOCK_SKEW_FUTURE_EVENT');
assert.equal(stableHash('abc').length,64);
assert.throws(()=>envelope({kind:'LIVE_ORDER',market:'BTC',source,sourceEventMs:t,receivedWallMs:t,
 receivedMonotonicMs:1,raw:'x',rawRef:'raw/1',collectorRunId:'run-001',
 messageId:'order',sourceDocumentUrl:'https://example.org',payload:{foo:1}}),/provenance/);
console.log('MAHORAGA v10 provenance, delay, dedup, gap, reconnect and leakage tests PASS');
