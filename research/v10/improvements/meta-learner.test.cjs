'use strict';
const assert=require('node:assert/strict'),M=require('./meta-learner.cjs');
const t=Date.parse('2026-06-11T00:00:00Z');
const f={trend:1,volatility:1,volume_ratio:2,spread_bps:0,order_imbalance:0,funding:0,open_interest_change:0};
const row=(expert,at=t)=>({expert,market:'BTCUSDT',side:'LONG',predicted_at_ms:at,
 matured_at_ms:at+3600000,available_to_model_ms:at,win_label:1,net_paper_pct:.2,
 archive_sha256:'a'.repeat(64),label_source:'MATURED_FROZEN_PAPER_SIM',features:f,
 expert_p:.7,preregistered_paper_convention:true});
const before=M.init();let trained=M.fit(before,[row('fusion')]);
assert.equal(trained.trained_rows,1);assert.equal(before.trained_rows,0);
assert.notEqual(M.fingerprint(before),M.fingerprint(trained));
assert.throws(()=>M.fit(trained,[row('fusion')]),/Leakage/);
assert.throws(()=>M.fit(M.init(),[row('fusion',Date.parse('2026-08-11T00:00:00Z'))]),/Leakage/);
const experts=['fusion','sweep','auction'].map(expert=>({...row(expert),side:'LONG'}));
assert.equal(M.combine(trained,experts,{data_valid:true,costs_verified:false,spread_bps:1}).side,'NONE');
assert.equal(M.combine(trained,experts,{data_valid:true,costs_verified:true,spread_bps:40}).side,'NONE');
assert.equal(M.combine(trained,experts,{data_valid:true,costs_verified:true,spread_bps:1}).orders_authorized,false);
assert.throws(()=>M.combine(trained,[experts[0],experts[0],experts[1]],{data_valid:true,costs_verified:true,spread_bps:1}),/duplicate/);
console.log('IMPROVEMENT 3 PASS: separately trained historical meta learner and immutable no-order ensemble');
