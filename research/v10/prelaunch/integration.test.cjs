'use strict';
const assert=require('node:assert/strict');
const F=require('./feedback.cjs'),E=require('./experts.cjs'),M=require('./supervisor.cjs'),
 D=require('./registry.cjs'),V=require('./evaluation.cjs');
const base=Date.parse('2026-11-18T00:00:00Z'),reg='v10-rehearsal-only';
let journal=F.start(reg);
const regime={};const paired=[];
for(let i=0;i<112;i++){
 const time=base+i*900000;
 const event={engine:'fusion',market:'BTC',observedAtMs:time,predictedHorizonMs:300000,
 side:'LONG',modelSha:'a'.repeat(40),inputRawShas:['b'.repeat(64)],registrationId:reg};
 journal=F.record(journal,event);
 const id=journal.decisions.at(-1).id;regime[id]='TREND_UP';
 journal=F.settle(journal,{decisionId:id,observedAtMs:time+300000,
  netPct:i%6===0?-.35:.22,costBps:16,outcomePriceSourceSha:'c'.repeat(64)});
 paired.push({registrationId:reg,prospective:true,market:'BTC',predictedAtMs:time,
  maturedAtMs:time+300000,candidateNetPct:i%6===0?-.35:.22,
  baselineNetPct:i%6===0?-.15:.18,candidateCostBps:16,baselineCostBps:16,
  day:new Date(time).toISOString().slice(0,10),modelVersion:'offline-v10-rehearsal'});
}
// Early segment only. Later observation outcomes are barred from the learner.
const cutoff=base+60*900000;
const rows=F.trainingRows(journal,cutoff,regime);
assert.equal(rows.length,60);
const model=E.train(rows,{trainEndMs:cutoff,registrationId:reg});
assert.equal(E.estimate(model,'fusion','TREND_UP','LONG').n,60);
const pred=M.decide(model,[{engine:'fusion',side:'LONG',costBps:16,observedAtMs:cutoff+1}],
 {regime:'TREND_UP',observedAtMs:cutoff+1,minSamples:30});
assert.equal(pred.liveReady,false);assert.equal(pred.actualOrder,false);
let state=D.register({history:[],championId:null},model,{createdAtMs:cutoff+1000,trainEndMs:cutoff});
assert.equal(state.history[0].productionAuthorized,false);
// Historical/mock observations are never a verified prospective experiment.
const fake=V.compare(paired.map(x=>({...x,prospective:true})),
 {registrationId:reg,minPairs:100,minGroups:2});
assert.equal(fake.independentForwardApproved,false);assert.equal(fake.automaticPromotion,false);
assert.equal(fake.status,'RESEARCH_ONLY_HOLD');
assert.throws(()=>E.train(F.trainingRows(journal,base+111*900000+300000,regime),
 {trainEndMs:cutoff,registrationId:reg}),/PROTECTED_TEST_OR_FUTURE_LABEL/);
console.log('MAHORAGA synthetic end-to-end: feedback -> train -> supervisor -> registry -> hold screen PASS');
console.log('Explicitly synthetic: 0 genuine forward learning trials, 0 actual orders, no profitability claim');
