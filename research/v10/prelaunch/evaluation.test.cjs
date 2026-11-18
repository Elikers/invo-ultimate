'use strict';const A=require('node:assert/strict'),{compare}=require('./evaluation.cjs');
const t=Date.parse('2026-11-18T07:00:00Z');
const row=(i)=>({registrationId:'v10-locked',prospective:true,market:i%2?'BTC':'ETH',
 predictedAtMs:t+i*300000,maturedAtMs:t+i*300000+60000,
 candidateNetPct:.2,baselineNetPct:.1,candidateCostBps:16,baselineCostBps:16,
 day:'2026-11-'+String(18+Math.floor(i/20)).padStart(2,'0'),modelVersion:'fixed-v10'});
const tiny=compare([row(0)],{registrationId:'v10-locked'});
A.equal(tiny.status,'RESEARCH_ONLY_HOLD');A.ok(tiny.blockers.includes('INSUFFICIENT_PAIRED_OBSERVATIONS'));
const many=compare(Array.from({length:60},(_,i)=>row(i)),{registrationId:'v10-locked',minPairs:50,minGroups:2});
A.equal(many.automaticPromotion,false);A.equal(many.pairedMeanDeltaPct,.1);
A.throws(()=>compare([row(0),row(0)],{registrationId:'v10-locked'}),/DUPLICATE/);
A.throws(()=>compare([{...row(0),prospective:false}],{registrationId:'v10-locked'}),/NON_PROSPECTIVE/);
A.throws(()=>compare([{...row(0),maturedAtMs:t-1}],{registrationId:'v10-locked'}),/NON_PROSPECTIVE/);
A.equal(compare([],{registrationId:'v10-locked'}).candidateMeanNetPct,null);
console.log('Phase E: forward matched evaluation, sample floors, no automatic approval PASS');
