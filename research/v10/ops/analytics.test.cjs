'use strict';
const assert=require('node:assert/strict'),A=require('./analytics.cjs'),D=require('./dashboard.cjs');
const empty=A.aggregate();
assert.equal(empty.evidence_reports_count,0);
assert.equal(empty.full_cost_forward_profitability,null);
assert.equal(empty.markets.BTC.reference_net_ex_funding,null);
const html=D.render(empty);
assert.ok(html.includes('NOT VERIFIED'));
assert.ok(html.includes('NO ORDERS'));
assert.ok(!html.includes('<script'));
const rep={schema:'mahoraga-v105-causal-outcomes-v1',
 profitability_verified:false,approved_for_live:false,funding_reconciled:false,
 verified_full_execution_costs:false,eligibility_to_train:false,source_gaps:2,
 markets:Object.fromEntries(['BTC','ETH','SOL'].map(m=>[m,{
 observations:m==='BTC'?2:0,missing:0,pending:m==='BTC'?1:0,no_trade:0,
 priced_reference_ex_funding:m==='BTC'?1:0,
 assumed_ex_funding_mean:m==='BTC'?-.003:null}])))};
const b=A.aggregate([rep]);
assert.equal(b.markets.BTC.reference_net_ex_funding,-.003);
assert.equal(b.markets.BTC.pending,1);
assert.equal(b.source_gaps,2);
assert.equal(b.full_cost_forward_profitability,null);
assert.throws(()=>A.aggregate([{...rep,profitability_verified:true}]),/Unsupported/);
assert.throws(()=>A.aggregate([{...rep,markets:{...rep.markets,BTC:{...rep.markets.BTC,observations:3}}}]),/Inconsistent/);
assert.throws(()=>D.render({...b,live_orders:true}),/Unsafe/);
const escaped=D.render({...b,data_origin:'<script>bad</script>'});
assert.ok(!escaped.includes('<script>'));
console.log('MAHORAGA v10.7 no-data dashboard, read-only rendering, source counters and XSS safety PASS');
