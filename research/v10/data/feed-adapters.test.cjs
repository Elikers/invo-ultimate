'use strict';
const assert=require('node:assert/strict'),A=require('./feed-adapters.cjs');
const raw={channel:'l2Book',data:{coin:'BTC',time:1795000000000,levels:[
 [{px:'100',sz:'1'},{px:'99',sz:'2'}],
 [{px:'101',sz:'3'},{px:'102',sz:'4'}]]}};
const b=A.book(raw);assert.equal(b.payload.spread_bps,1e4/100.5);
assert.throws(()=>A.book({...raw,data:{...raw.data,levels:[
 [{px:'101',sz:'1'}],[{px:'100',sz:'1'}]]}}),/Crossed/);
assert.throws(()=>A.book({...raw,data:{...raw.data,levels:[
 [{px:'100',sz:'-1'}],[{px:'101',sz:'1'}]]}}),/quantity/);
const trades=A.trades({channel:'trades',data:[{coin:'BTC',time:1795000000123,side:'B',tid:10,px:'100.1',sz:'0.2'}]});
assert.equal(trades[0].sourceMessageId,'10');
assert.throws(()=>A.trades({channel:'trades',data:[{coin:'BTC',time:1,side:'?',tid:10,px:'1',sz:'1'}]}),/fields/);
const c=A.context({channel:'activeAssetCtx',data:{coin:'BTC',ctx:{markPx:'100',oraclePx:'99',openInterest:'200',funding:'0.0001'}}},1795000000900);
assert.equal(c.sourceEventMs,null);
assert.throws(()=>A.requiredTimestamp(c),/never invent/);
assert.throws(()=>A.context({channel:'activeAssetCtx',data:{coin:'BTC',ctx:{markPx:'100',oraclePx:'99',openInterest:'200',funding:'5'}}},1795000000900),/funding/);
assert.equal(A.requiredTimestamp(b),1795000000000);
console.log('MAHORAGA A strict exchange adapters PASS');
