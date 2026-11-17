const assert=require('node:assert/strict'),Q=require('./journal-quality.cjs');
const BAR=300000,t=1794951000000,now=t+10*BAR;
const base={id:'BTC|sweep|'+t,strategy:'sweep',side:'LONG',status:'CLOSED',signal_bar_t:t,observed_at_utc:new Date(t+BAR+1000).toISOString(),
entry_t:t+2*BAR,entry:100,exit_t:t+3*BAR,exit:101,reason:'TARGET',gross_pct:1,net_pct:{'8':.92,'16':.84}};
const journal=x=>({schema:'invo-v6.3-forward-1',markets:{BTC:{observations:[x]}}});
assert.equal(Q.audit(journal(base),now).closed,1);
assert.equal(Q.audit(journal({...base,status:'PENDING',entry:undefined,exit:undefined,exit_t:undefined,gross_pct:undefined,net_pct:undefined,reason:undefined}),now).pending,1);
assert.throws(()=>Q.audit(journal({...base,net_pct:{'8':1,'16':.84}}),now),/accounting mismatch/);
assert.throws(()=>Q.audit(journal({...base,exit_t:t+15*BAR}),now),/window/);
assert.throws(()=>Q.audit(journal({...base,id:'BTC|mean|'+t}),now),/identity mismatch/);
assert.throws(()=>Q.audit(journal({...base,entry_t:t+BAR}),now),/chronology/);
assert.throws(()=>Q.audit({schema:'invo-v6.3-forward-1',markets:{BTC:{observations:[base,base]}}},now),/duplicate/);
assert.throws(()=>Q.audit(journal({...base,status:'OPEN'}),now),/unfinished/);
assert.throws(()=>Q.audit({schema:'wrong'},now),/schema/);
console.log('INVO paper journal quality gate tests passed');
