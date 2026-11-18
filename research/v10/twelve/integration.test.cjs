'use strict';
// Whole 12-gate OFFLINE rehearsal. Synthetic fixtures only; no real predictions/fills.
const assert=require('node:assert/strict'),F=require('./features.cjs'),
 O=require('./predictions.cjs'),P=require('./paper.cjs'),L=require('./ledger.cjs'),
 B=require('./batch.cjs'),R=require('./registry.cjs'),A=require('./readiness.cjs');
const t=Date.parse('2026-11-19T00:10:00Z');
const bars=Array.from({length:25},(_,i)=>({close_available_ms:t-(25-i)*300000,
 close:100+i*.02,high:101+i*.02,low:99+i*.02,volume:100+i}));
const feature=F.build({market:'BTC',decisionTimeMs:t,bars,
 book:{market:'BTC',available_ms:t-100,verified:true,snapshot:true,
 bids:[{px:100.01,sz:4}],asks:[{px:100.03,sz:3}]},
 context:{market:'BTC',available_ms:t-500,receipt_only:true,verified:true,
 funding:.0001,oi:120},
 previousContext:{market:'BTC',available_ms:t-30000,verified:true,oi:118}});
assert.equal(feature.observed.length,7);
const obs=O.observe({features:feature,models:{},
 baseline:{side:'LONG',predicted_at_ms:t,version_sha256:'a'.repeat(64),
 frozen_source_verified:true},availableAtMs:t-200,nowMs:t});
let ledger=L.append([],obs,t);
const future=Array.from({length:12},(_,i)=>({high:101.8,low:99.9,
 close:101.1,available_ms:t+(i+1)*300000}));
const p=P.settle(obs,{entry:100,completedBars:future,
 costs:{fee_bps:8,spread_bps:1,slippage_bps:3,source:'ASSUMED_PAPER'},
 recordedAtMs:t+3600050,
 modelVersionHashes:Object.fromEntries(obs.decisions.map(d=>[d.engine,d.version_sha256]))});
ledger=L.append(ledger,{...p,type:'MULTI_OUTCOME'},t+3600050);
assert.equal(L.verify(ledger).events,2);
assert.equal(p.labels.length,10);
assert.equal(p.labels.filter(x=>x.label_type==='NO_TRADE').length,9);
const reg=R.enroll('fusion');assert.equal(reg.challenger.updates,0);
assert.equal(L.candidateTrainingRow(obs,p,'fusion',obs.training_feature_snapshot,'x'),null);
const readiness=A.audit({registeredExperiment:{sha256:'a'.repeat(64),
 start_ms:Date.parse('2026-11-19T00:00:00Z')}});
assert.equal(readiness.status,'BLOCKED');
assert.equal(readiness.activation_authorized,false);
console.log(JSON.stringify({schema:'invo-v10-12-gate-integration-fixture-1',
 status:'PASS_OFFLINE_SYNTHETIC',captured_market:'BTC',feature_count:feature.observed.length,
 frozen_engine_decisions:obs.decisions.length,paper_labels:p.labels.length,
 specialist_models_updated:0,independent_forward_net_evidence:0,
 release:readiness.status,production_orders:false,continuous_runtime:false},null,2));
