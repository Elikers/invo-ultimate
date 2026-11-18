'use strict';
const assert=require('node:assert/strict'),T=require('./temporal.cjs'),R=require('../learners/registration.json');
const base=Date.parse('2026-11-19T00:00:00Z'),names=R.feature_names;
const full={observed:names,values:{trend:1,volatility:1,volume_ratio:1,spread_bps:2,order_imbalance:.2,funding:.0001,open_interest_change:.1}};
const row=(id,t,mature,features=full)=>({id,expert:'fusion',predicted_at_ms:t,matured_at_ms:mature,
 feature_available_ms:t,win_label:1,label_source:'MATURED_FROZEN_PAPER_SIM',source_verified:true,features});
const bounds={train_end_ms:base+1000,validation_end_ms:base+2000,test_end_ms:base+3000};
const a=T.split([row('a',base+100,base+500),row('b',base+800,base+1200),
 row('c',base+1400,base+1800),row('d',base+2500,base+2600)],bounds);
assert.equal(a.train.length,1);assert.equal(a.purged.length,1);
assert.equal(a.validation.length,1);assert.equal(a.test.length,1);
assert.throws(()=>T.split([row('a',base+100,base+500),row('a',base+700,base+800)],bounds),/Invalid/);
assert.throws(()=>T.split([row('a',base+100,base+500),row('b',base+80,base+600)],bounds),/Invalid/);
assert.throws(()=>T.normalize({observed:['trend'],values:{trend:1,funding:0}}),/falsely/);
assert.deepEqual(T.normalize({observed:['trend'],values:{trend:1}}).mask,[1,0,0,0,0,0,0]);
const trained=T.trainOnly(a.train.map(x=>({...x,purpose:'TRAIN',split:'train'})),'fusion');
assert.equal(trained.updates,1);assert.equal(trained.independent_profit,null);
const masked=T.trainOnly([{...a.train[0],features:T.normalize({observed:['trend'],values:{trend:1}}),purpose:'TRAIN',split:'train'}],'fusion');
assert.equal(masked.updates,0);
console.log('GATE 2 chronology, purge, observed/missing mask, train-only specialist PASS');
