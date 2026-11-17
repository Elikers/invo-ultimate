const assert=require('node:assert/strict'),F=require('./v7-paper.cjs'),BAR=300000;
const reg={schema:'invo-v7.3-prospective-registration-1',registered_utc:'1970-01-01T00:00:00Z',
 baseline:{stop_pct:1,target_pct:1.5,hold_bars:12},
 candidates:[{id:'CANDIDATE_SHORTER_TIME_EXIT',stop_pct:1,target_pct:1.5,hold_bars:8},{id:'CANDIDATE_TIGHTER_STOP',stop_pct:.8,target_pct:1.5,hold_bars:12}],
 preregistered_pairs:[{coin:'JUP',strategy:'volbreak'}],execution_assumptions:{cost_bps:[8,16,24]}};
const bars=from=>Array.from({length:900},(_,i)=>({t:(from+i)*BAR,o:100,h:100.2,l:99.8,c:100,v:1}));
const j=F.init(reg,900*BAR+10000);
assert.equal(F.update(j,'JUP',bars(0),()=>({side:'LONG'}),900*BAR+10000,reg).new_signals,0);
let first=F.update(j,'JUP',bars(1),(id)=>({side:'LONG'}),901*BAR+10000,reg);
assert.equal(first.new_signals,3);
assert.equal(j.markets.JUP.observations.every(x=>x.status==='PENDING'),true);
const second=F.update(j,'JUP',bars(2),()=>null,902*BAR+10000,reg);
assert.equal(second.closed,0);
const third=F.update(j,'JUP',bars(3),()=>null,903*BAR+10000,reg);
assert.equal(j.markets.JUP.observations.every(x=>x.status==='OPEN'),true);
assert.equal(F.summarize(j,reg).closed,0);
assert.equal(F.update(j,'JUP',bars(3),()=>({side:'LONG'}),903*BAR+20000,reg).new_signals,0);
assert.throws(()=>F.update(j,'BTC',bars(4),()=>null,904*BAR+10000,reg),/Unregistered/);
const later=F.update(j,'JUP',bars(15),()=>null,915*BAR+10000,reg);
assert.equal(later.closed,3);
assert.equal(F.summarize(j,reg).closed,3);
assert.equal(j.markets.JUP.observations.every(x=>x.net_pct['16']<x.net_pct['8']),true);
assert.throws(()=>F.update(j,'JUP',bars(15).slice(0,40),()=>null,915*BAR+20000,reg),/Invalid completed/);
console.log('INVO v7.3 separate experimental forward paper collector tests passed');
