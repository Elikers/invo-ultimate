'use strict';const assert=require('node:assert/strict'),L=require('./ledger.cjs'),P=require('./paper.cjs'),
 O=require('./predictions.cjs'),SR=require('../shadow/registration.json');
const t=Date.parse('2026-11-19T00:02:00Z');
const obs=O.observe({features:{market:'BTC',decisionTimeMs:t,values:{},observed:[],
 live_orders_allowed:false},models:{},
 baseline:{side:'LONG',predicted_at_ms:t,version_sha256:'f'.repeat(64),
 frozen_source_verified:true},availableAtMs:t-100,nowMs:t});
const bars=Array.from({length:12},(_,i)=>({available_ms:t+(i+1)*300000,high:101.6,low:99.9,close:100}));
const versions=Object.fromEntries(obs.decisions.map(d=>[d.engine,d.version_sha256]));
const outcome=P.settle(obs,{entry:100,completedBars:bars,
 costs:{fee_bps:8,spread_bps:1,slippage_bps:1,source:'ASSUMED_PAPER'},
 recordedAtMs:t+3600100,modelVersionHashes:versions});
let j=L.append([],obs,t);
j=L.append(j,{...outcome,type:'MULTI_OUTCOME'},outcome.recorded_at_ms);
assert.equal(L.verify(j).events,2);
assert.equal(j[1].item.labels.length,10);
assert.equal(L.candidateTrainingRow(obs,outcome,'fusion',{values:{},observed:[]},'x'),null);
assert.throws(()=>L.candidateTrainingRow(obs,outcome,'baseline',{values:{},observed:[]},'x'),/Unmatched/);
assert.throws(()=>L.candidateTrainingRow(obs,outcome,'invalid',{},'x'),/Unmatched/);
assert.throws(()=>L.append(j,{...outcome,type:'MULTI_OUTCOME'},outcome.recorded_at_ms+1),/duplicated/);
const broken=structuredClone(j);broken[0].item.market='ETH';
assert.throws(()=>L.verify(broken),/Broken/);
console.log('MAHORAGA 06 10-engine single-observation ledger and quarantine-first training bridge PASS');
