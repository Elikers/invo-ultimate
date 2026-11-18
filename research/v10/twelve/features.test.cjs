'use strict';
const assert=require('node:assert/strict'),F=require('./features.cjs');
const t=Date.parse('2026-11-19T00:00:00Z');
const bars=Array.from({length:25},(_,i)=>({close_available_ms:t-25*300000+i*300000,
 close:100+i*.1,high:101+i*.1,low:99+i*.1,volume:10+i}));
const book={market:'BTC',available_ms:t-100,verified:true,snapshot:true,
 bids:[{px:101,sz:4}],asks:[{px:101.1,sz:2}]};
const ctx={market:'BTC',available_ms:t-1000,receipt_only:true,verified:true,funding:.0001,oi:300};
const old={market:'BTC',available_ms:t-30000,verified:true,oi:200};
const x=F.build({market:'BTC',decisionTimeMs:t,bars,book,context:ctx,previousContext:old});
assert.equal(x.observed.length,7);assert.equal(x.missing.length,0);assert.equal(x.training_eligible,false);
const m=F.build({market:'BTC',decisionTimeMs:t,bars});
assert.ok(m.missing.includes('spread_bps'));assert.ok(!Object.hasOwn(m.values,'spread_bps'));
assert.throws(()=>F.build({market:'BTC',decisionTimeMs:t,bars:[...bars.slice(0,-1),{...bars.at(-1),close_available_ms:t+100}]}),/Future/);
assert.throws(()=>F.build({market:'BTC',decisionTimeMs:t,bars,book:{...book,available_ms:t+1}}),/Untrusted/);
assert.throws(()=>F.build({market:'BTC',decisionTimeMs:t,bars,book:{...book,asks:[{px:100,sz:2}]}}),/Crossed/);
assert.throws(()=>F.build({market:'BTC',decisionTimeMs:t,bars,context:{...ctx,available_ms:t+100}}),/Untrusted/);
console.log('MAHORAGA 03 feature engineering, masks and future-data rejection PASS');
