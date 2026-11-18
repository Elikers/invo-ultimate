'use strict';const assert=require('node:assert/strict'),T=require('./historical-train.cjs');
const bars=Array.from({length:100},(_,i)=>{const p=100+i*.01;return {t:1795000000000+i*300000,o:p,h:p+.2,l:p-.2,c:p,v:1}});
const f=T.features(bars,70);
assert.equal(f.spread_bps,0);assert.equal(f.order_imbalance,0);assert.equal(f.volume_ratio,1);
const archive={kind:'RETROSPECTIVE_ONLY_NOT_FORWARD',source:'BINANCE_VISION_USDM_HISTORICAL_ARCHIVE',
 symbol:'BTCUSDT',month:'2026-04',sha256:'a'.repeat(64),bars};
const report=T.train(archive,()=>null);
assert.equal(report.reports.length,8);
assert.equal(report.reports.find(x=>x.expert==='scalping').training_examples,0);
assert.equal(report.independent_forward_samples,0);
assert.ok(report.reports.every(x=>x.independent_net_profit===null));
assert.throws(()=>T.train({...archive,sha256:'bad'},()=>null),/Invalid/);
console.log('MAHORAGA verified-archive historical TRAIN-only pipeline offline fixture PASS');
