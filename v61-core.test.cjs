const assert=require('node:assert/strict');
const C=require('./v61-core.js');
const bars=Array.from({length:110},(_,i)=>({t:i*300000,o:100,h:100.2,l:99.8,c:100}));
const sig=Array(110).fill(null);sig[65]={side:'LONG'};sig[66]={side:'LONG'};
bars[66]={...bars[66],h:102,l:98};
const a=C.simulate(bars,sig);
assert.equal(a.length,1,'overlapping signals must be skipped');
assert.equal(a[0].reason,'STOP_BOTH','both intrabar levels must resolve against the strategy');
assert.ok(Math.abs(a[0].netPct-(-1.08))<1e-9);
assert.ok(C.simulate(bars,sig,{costBps:20})[0].netPct<a[0].netPct);
const gap=bars.map(x=>({...x}));
// Enter at candle 66 open=100 without hitting the stop (99) or target (101.5).
gap[66]={...gap[66],o:100,h:100.2,l:99.8,c:100};
// Candle 67 opens below the existing long stop, which must fill at the worse open.
gap[67]={...gap[67],o:97,h:100,l:96,c:99};
const gapTrade=C.simulate(gap,sig)[0];
assert.equal(gapTrade.reason,'STOP_GAP');
assert.equal(gapTrade.exitIndex,67);
assert.equal(gapTrade.entry,100);
assert.equal(gapTrade.exit,97);
assert.ok(Math.abs(gapTrade.netPct-(-3.08))<1e-9);
assert.ok(C.valid(bars));assert.equal(C.valid([bars[0],bars[2],...bars.slice(3)]),false);
assert.equal(C.summary([]).expectancyPct,null);
assert.equal(C.validate(bars,[]).status,'INSUFFICIENT SAMPLE — NOT VALIDATED');
console.log('INVO v6.1 trade-accounting tests passed');
