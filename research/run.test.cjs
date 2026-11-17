const assert=require('node:assert/strict');
const fs=require('node:fs');
const C=require('../v61-core.js'),R=require('./run.cjs');
const html=fs.readFileSync('index.html','utf8');
const signal=R.strategyFromWebsite(html);
const b=Array.from({length:500},(_,i)=>({t:i*300000,o:100,h:101,l:99,c:100,v:100}));
assert.equal(C.valid(b),true);
for(const id of ['fusion','strict','sweep','auction','pullback','volbreak','mean']){
 const s=signal(id,b.slice(0,200));assert.ok(s===null||['LONG','SHORT'].includes(s.side),id+' did not return a valid signal');
}
const rows=R.runOne(b,'fusion',signal);
assert.equal(rows.length,2);
assert.equal(rows[0].folds.length,3);
assert.equal(rows[0].cost_bps_round_trip,8);
assert.equal(rows[1].cost_bps_round_trip,16);
assert.equal(R.quality(rows[0].folds),'INSUFFICIENT_SAMPLES');
assert.throws(()=>R.parse(b.slice(1).map(x=>({...x,s:'BTC'})),'BTC',500*300000),/Candle count/);
const sample=[{signalIndex:11,entryIndex:12,exitIndex:13,netPct:2},{signalIndex:130,entryIndex:131,exitIndex:133,netPct:-1},{signalIndex:350,entryIndex:351,exitIndex:355,netPct:3}];
const slices=R.splitSummary(b,sample);
assert.equal(slices[0].count,0,'train embargo must exclude nearby boundary');
assert.equal(slices[1].count,1);
assert.equal(slices[2].count,1);
console.log('v6.2 offline research tests passed');
