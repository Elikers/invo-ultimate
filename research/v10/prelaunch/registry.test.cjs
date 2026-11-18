'use strict';
const A=require('node:assert/strict'),L=require('./experts.cjs'),D=require('./registry.cjs');
const t=Date.parse('2026-11-18T06:00:00Z');
const model=L.train([],{trainEndMs:t-1000,registrationId:'registry-test'});
let state=D.register({history:[],championId:null},model,{createdAtMs:t,trainEndMs:t-1000});
A.equal(state.history.length,1);A.equal(state.history[0].productionAuthorized,false);
A.throws(()=>D.register(state,model,{createdAtMs:t,trainEndMs:t-1000}),/DUPLICATE/);
const id=state.history[0].id;
A.equal(D.evaluateChallenger(state,id,{closed:0}).status,'HOLD');
const gates={preregistered:true,strictly_forward:true,independent_costs:true,
 matched_baseline:true,uncertainty_checked:true,drawdown_checked:true,no_test_training:true,
 closed:100,lowerCi95NetPct:.1};
const report=D.evaluateChallenger(state,id,gates);
A.equal(report.status,'ELIGIBLE_FOR_SEPARATE_HUMAN_REVIEW');
A.equal(report.automaticPromotion,false);
state=D.offlineRollback(state,id);A.equal(state.championId,id);
A.equal(D.inspectDrift([{netPct:-1}]).status,'INSUFFICIENT_OUTCOMES');
A.equal(D.inspectDrift(Array.from({length:30},()=>({netPct:-.5}))).status,'REVIEW_CHAMPION_FOR_DRIFT');
A.equal(D.fingerprint(model),D.fingerprint(JSON.parse(JSON.stringify(model))));
console.log('Phase D: immutable versions, sample floors, drift and manual promotion PASS');
