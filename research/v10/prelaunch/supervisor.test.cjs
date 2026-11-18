'use strict';
const A=require('node:assert/strict'),L=require('./experts.cjs'),M=require('./supervisor.cjs');
const now=Date.parse('2026-11-18T05:00:00Z'),rows=[];
for(let i=0;i<50;i++)rows.push({engine:'fusion',side:'LONG',regime:'TREND_UP',
 predictedAtMs:now-10000000+i*1000,maturedAtMs:now-5000000+i*1000,
 netPct:.4,costBps:16,sourceHash:'a'.repeat(64),registrationId:'super-test'});
let model=L.train(rows,{trainEndMs:now,registrationId:'super-test'});
const signals=[{engine:'fusion',side:'LONG',costBps:16,observedAtMs:now}];
A.equal(M.decide(model,signals,{regime:'TREND_UP',observedAtMs:now,minSamples:30}).side,'LONG');
A.equal(M.decide(model,signals,{regime:'TREND_UP',observedAtMs:now,minSamples:60}).side,'NONE');
A.equal(M.decide(model,[],{regime:'TREND_UP',observedAtMs:now}).side,'NONE');
A.throws(()=>M.decide(model,[{...signals[0],observedAtMs:now+1}],{regime:'TREND_UP',observedAtMs:now}),/FUTURE/);
A.throws(()=>M.decide(model,[...signals,...signals],{regime:'TREND_UP',observedAtMs:now}),/INVALID/);
A.equal(M.decide(model,signals,{regime:'TREND_UP',observedAtMs:now}).liveReady,false);
console.log('Phase C: abstention, qualified descriptive ranking, no-live decisions PASS');
