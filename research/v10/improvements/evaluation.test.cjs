'use strict';const assert=require('node:assert/strict'),E=require('./evaluation.cjs');
const first=Date.parse('2026-08-01T00:00:00Z');
const rows=Array.from({length:24},(_,i)=>({id:'day-'+i,expert:'fusion',
 predicted_at_ms:first+i*86400000,feature_available_ms:first+i*86400000,
 outcome_matured_ms:first+i*86400000+3600000,
 evidence_kind:'RETROSPECTIVE',fixed_action:'TRADE',expert_action:'TRADE',
 mahoraga_action:i%2?'NONE':'TRADE',fixed_net_pct:-.1,expert_net_pct:.2,
 mahoraga_net_pct:i%2?0:.1,venue_contract_verified:true,cost_scenario_bps:8}));
const x=E.evaluate(rows,{registered:true,minimumDays:20});
assert.equal(x.opportunities,24);assert.equal(x.mahoraga.trades,12);
assert.equal(x.status,'RESEARCH_ONLY_NOT_PROMOTABLE');
assert.ok(x.blockers.includes('RETROSPECTIVE_EVIDENCE_ONLY'));
assert.throws(()=>E.evaluate(rows,{registered:true,prospective:true}),/Retrospective/);
assert.throws(()=>E.evaluate([...rows,rows[0]]),/Unmatched/);
assert.throws(()=>E.evaluate(rows.map(r=>({...r,mahoraga_action:'NONE'}))),/Abstentions/);
assert.ok(E.evaluate(rows.slice(0,5)).blockers.includes('TOO_FEW_INDEPENDENT_DAYS'));
console.log('IMPROVEMENT 4 PASS: paired outcomes, abstention costs, calendar clusters, retrospective release rejection');
