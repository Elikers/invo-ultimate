'use strict';
// End-to-end offline research rehearsal: synthetic book -> validation -> eight models -> safe abstention -> immutable decision -> release BLOCKED.
const assert=require('node:assert/strict');
const A=require('../data/feed-adapters.cjs'),P=require('../data/provenance.cjs');
const L=require('../learners/specialists.cjs'),R=require('../learners/registration.json');
const S=require('../supervisor/supervisor.cjs'),F=require('../feedback/feedback.cjs');
const E=require('../evidence/evaluate.cjs');
const t=Date.parse('2026-11-19T00:05:00Z');
const msg={channel:'l2Book',data:{coin:'BTC',time:t,levels:[
 [{px:'100',sz:'2'},{px:'99',sz:'4'}],
 [{px:'100.1',sz:'2'},{px:'101',sz:'3'}]]}};
const parsed=A.book(msg);
const event=P.envelope({kind:'BOOK_SNAPSHOT',market:'BTC',source:{venue:'hyperliquid',feed:'l2Book',venue_symbol:'BTC',instrument_type:'PERPETUAL'},payload:parsed.payload,
 sourceEventMs:parsed.sourceEventMs,receivedWallMs:t+30,receivedMonotonicMs:10,raw:JSON.stringify(msg),
 rawRef:'offline-only/fixture',collectorRunId:'offline-integration',messageId:'book-btc-001',
 reconnectEpoch:0,snapshot:true,sourceDocumentUrl:'https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions'});
const checked=P.validateSequence({},event);
assert.equal(checked.status,'RESEARCH_ACCEPTED_NOT_TRAINING_APPROVED');
const xs={trend:0,volatility:0,volume_ratio:1,spread_bps:parsed.payload.spread_bps,
 order_imbalance:0,funding:0,open_interest_change:0};
const specialists=R.experts.map(expert=>L.create(expert));
assert.equal(specialists.length,8);
assert.equal(specialists.every(x=>x.updates===0),true);
const candidateOpinions=specialists.slice(0,3).map((model,i)=>({expert:model.expert,side:i===1?'SHORT':'LONG',
 probability:L.probability(model,xs),reliability:0.6,predicted_at_ms:t+40,
 model_fingerprint:L.fingerprint(model)}));
// Even with data integrity, economics not independently verified -> NO TRADE.
const advisor=S.decide(candidateOpinions,{data_valid:event.quality.valid,
 costs_verified:false,spread_bps:parsed.payload.spread_bps});
assert.equal(advisor.side,'NONE');
assert.equal(advisor.trade_authorized,false);
let journal=F.add([],{type:'DECISION',id:'btc-mahoraga-offline-001',expert:'mahoraga',
 side:advisor.side,model_sha256:'a'.repeat(64),predicted_at_ms:t+40,
 feature_available_ms:t+30,mature_after_ms:t+900040,
 recorded_at_ms:t+50,registration_id:'offline-only-v10',production_authorized:false});
assert.equal(F.verify(journal).verified,true);
assert.equal(F.trainingRows(journal,t+1000000).length,0);
const release=E.evaluate({forward_trade_count:0,
 groups:R.experts.map(id=>({id,closed:0,lower_bound_95_net_pct:null})),
 holdout_registration_immutable:false,matched_forward_baselines:false,costs_verified:false,
 execution_fills_verified:false,clustering_and_multiplicity_adjusted:false,
 drawdown_and_tails_reviewed:false,data_gap_audit_passed:false,
 all_models_frozen_before_test:false});
assert.equal(release.status,'BLOCKED');
assert.equal(release.website_inference_enabled,false);
console.log(JSON.stringify({status:'PASS_OFFLINE_ONLY',feed_event_quality:checked.status,
 expert_count:specialists.length,trained_on_actual_data:false,advisory:advisor.side,
 decision_chain_verified:true,trade_executed:false,activation:release.status},null,2));
