'use strict';
const A=require('node:assert/strict'),F=require('./feedback.cjs');
const t=Date.parse('2026-11-18T03:00:00Z');
const input={engine:'fusion',market:'BTC',observedAtMs:t,predictedHorizonMs:900000,
 side:'LONG',modelSha:'a'.repeat(40),inputRawShas:['b'.repeat(64)],registrationId:'v10-test'};
let j=F.start('v10-test');j=F.record(j,input);
A.equal(j.decisions.length,1);
A.equal(j.decisions[0].liveTrade,false);
A.throws(()=>F.record(j,input),/REPEATED/);
const id=j.decisions[0].id;
A.throws(()=>F.settle(j,{decisionId:id,observedAtMs:t+1000,netPct:.5,costBps:16,outcomePriceSourceSha:'c'.repeat(64)}),/NOT_MATURED/);
j=F.settle(j,{decisionId:id,observedAtMs:t+900000,netPct:-.15,costBps:16,outcomePriceSourceSha:'c'.repeat(64)});
A.equal(j.outcomes.length,1);
A.equal(F.trainingRows(j,t+800000,{[id]:'TREND_UP'}).length,0);
const rows=F.trainingRows(j,t+1000000,{[id]:'TREND_UP'});
A.equal(rows.length,1);A.equal(rows[0].netPct,-.15);
A.throws(()=>F.settle(j,{decisionId:id,observedAtMs:t+1000000,netPct:-.3,costBps:16,outcomePriceSourceSha:'c'.repeat(64)}),/DUPLICATE/);
A.throws(()=>F.trainingRows(j,t+1000000,{}),/MISSING_PAST_ONLY/);
console.log('MAHORAGA immutable decision feedback and matured outcome join PASS');
