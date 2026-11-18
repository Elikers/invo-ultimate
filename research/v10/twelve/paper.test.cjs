'use strict';
const assert=require('node:assert/strict'),P=require('./paper.cjs'),O=require('./predictions.cjs'),R=require('../shadow/registration.json');
const t=Date.parse('2026-11-19T00:01:00Z');
const features={market:'BTC',decisionTimeMs:t,values:{},observed:[],live_orders_allowed:false};
const baseline={side:'LONG',version_sha256:'a'.repeat(64),frozen_source_verified:true,predicted_at_ms:t};
const obs=O.observe({features,models:{},baseline,availableAtMs:t-100,nowMs:t});
const bars=Array.from({length:12},(_,i)=>({high:101.7,low:99.9,close:101.1,available_ms:t+(i+1)*300000}));
const versions=Object.fromEntries(obs.decisions.map(x=>[x.engine,x.version_sha256]));
const result=P.settle(obs,{entry:100,completedBars:bars,costs:{fee_bps:8,spread_bps:2,
 slippage_bps:4,source:'ASSUMED_PAPER'},recordedAtMs:t+3600001,modelVersionHashes:versions});
assert.equal(result.labels.length,10);
assert.ok(Math.abs(result.labels.find(x=>x.engine==='baseline').net_paper_pct-1.36)<1e-8);
assert.equal(result.labels.filter(x=>x.label_type==='NO_TRADE').length,9);
assert.equal(result.training_approved,false);
assert.throws(()=>P.settle(obs,{entry:100,completedBars:bars,costs:{fee_bps:8,spread_bps:2,slippage_bps:4,
 source:'ASSUMED_PAPER'},recordedAtMs:t+2000,modelVersionHashes:versions}),/Premature/);
assert.throws(()=>P.settle(obs,{entry:100,completedBars:bars,costs:{fee_bps:8,spread_bps:2,slippage_bps:4,
 source:'ASSUMED_PAPER'},recordedAtMs:t+3600001,modelVersionHashes:{...versions,baseline:'b'.repeat(64)}}),/Model version/);
const both=P.paperExit({side:'LONG',entry:100,completedBars:bars.map(x=>({...x,low:98,high:103}))});
assert.equal(both.reason,'STOP_PRIORITY');
assert.throws(()=>P.cost({fee_bps:-1,spread_bps:1,slippage_bps:1,source:'ASSUMED_PAPER'}),/cost/);
console.log('MAHORAGA 06-08 multi-engine matured labels, assumed net costs, stop priority, no-trade PASS');
