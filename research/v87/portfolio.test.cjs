'use strict';const assert=require('node:assert/strict');const {exposure}=require('./portfolio.cjs');
const ps=[
 {market:'BTC',start_ms:0,end_ms:1000,notional_usd:1000,stop_pct:1},
 {market:'ETH',start_ms:200,end_ms:900,notional_usd:2000,stop_pct:1},
 {market:'SOL',start_ms:1000,end_ms:2000,notional_usd:500,stop_pct:1}
];
const x=exposure(ps,10000);assert.equal(x.peak_gross_notional_over_equity,.3);
assert.equal(x.peak_simultaneous_stop_risk_pct_equity,.3);
assert.equal(x.peak_distinct_markets,2);
assert.equal(x.status,'DESCRIPTIVE_ONLY_NO_RISK_PARAMETER_CHANGE');
assert.throws(()=>exposure([{...ps[0],notional_usd:-10}],10000),/Invalid/);
assert.throws(()=>exposure(ps,0),/Invalid/);
console.log('v8.7 concurrent exposure and stop-risk tests passed');
