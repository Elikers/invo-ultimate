'use strict';
const A=require('node:assert/strict'),F=require('./adapters.cjs');
const t=Date.parse('2026-11-18T03:01:00Z');
const l2={channel:'l2Book',data:{coin:'BTC',time:t,levels:[
 [{px:'100',sz:'2',n:2},{px:'99',sz:'1',n:1}],
 [{px:'101',sz:'1',n:2},{px:'102',sz:'3',n:1}]]}};
const book=F.hyperliquidL2(l2);
A.equal(book.payload.spreadBps,1e4/100.5);A.equal(book.sourceTimeVerified,true);
A.throws(()=>F.hyperliquidL2({...l2,data:{...l2.data,time:null}}),/SOURCE_TIME/);
A.throws(()=>F.hyperliquidL2({...l2,data:{...l2.data,levels:[l2.data.levels[1],l2.data.levels[0]]}}),/CROSSED_BOOK/);
A.throws(()=>F.hyperliquidL2({...l2,data:{...l2.data,levels:[[l2.data.levels[0][0],l2.data.levels[0][0]],l2.data.levels[1]]}}),/UNSORTED/);
const trades=F.hyperliquidTrades({channel:'trades',data:[{coin:'BTC',px:'100',sz:'3',time:t,side:'B',tid:128}]});
A.equal(trades.length,1);A.equal(trades[0].payload.aggressorSide,'B');
A.throws(()=>F.hyperliquidTrades({channel:'trades',data:[{coin:'BTC',px:'0',sz:'3',time:t,side:'B',tid:1}]}),/INVALID/);
const ctx=F.hyperliquidContext({channel:'activeAssetCtx',data:{coin:'BTC',ctx:{markPx:'100',oraclePx:'99',funding:'0.0001',openInterest:'1000'}}},t);
A.equal(ctx.sourceTimeVerified,false);A.equal(ctx.eventTimeMs,null);
A.throws(()=>F.hyperliquidContext({channel:'activeAssetCtx',data:{coin:'BTC',ctx:{markPx:'-1',oraclePx:'99',funding:'0.01',openInterest:'1000'}}},t),/INVALID/);
console.log('Phase A: bounded feed adapters and malformed-message tests PASS');
