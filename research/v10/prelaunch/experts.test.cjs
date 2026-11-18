'use strict';
const A=require('node:assert/strict'),L=require('./experts.cjs');
const end=Date.parse('2026-11-18T04:00:00Z');
const mk=(engine,i=0)=>({engine,side:'LONG',regime:'TREND_UP',
 predictedAtMs:end-100000+i*1000,maturedAtMs:end-50000+i*1000,
 netPct:i%2?-.2:.4,costBps:16,sourceHash:'a'.repeat(64),registrationId:'test-reg-1'});
const rows=L.EXPERTS.map((e,i)=>mk(e,i));
const m=L.train(rows,{trainEndMs:end,registrationId:'test-reg-1'});
A.equal(Object.keys(m.experts).length,8);
A.equal(L.estimate(m,'scalping','TREND_UP','LONG').n,1);
A.ok(L.estimate(m,'fusion','TREND_UP','LONG').shrunkenHistoricalMeanNetPct<.4);
A.equal(L.estimate(m,'fusion','RANGE','SHORT').n,0);
A.equal(m.productionEnabled,false);
A.throws(()=>L.train([{...mk('fusion'),maturedAtMs:end+1}],{trainEndMs:end,registrationId:'test-reg-1'}),/PROTECTED_TEST/);
A.throws(()=>L.train([mk('fusion'),mk('fusion')],{trainEndMs:end,registrationId:'test-reg-1'}),/DUPLICATED/);
A.throws(()=>L.train([{...mk('fusion'),side:'NONE',netPct:.2}],{trainEndMs:end,registrationId:'test-reg-1'}),/ABSTENTION/);
console.log('Phase B: all eight research learner pipelines, leakage/duplicate guards PASS');
