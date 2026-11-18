'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const C=require('../next/capture.cjs'),F=require('./features.cjs'),P=require('../data/provenance.cjs');
const now=Date.parse('2026-11-20T00:15:15.000Z'),h='c'.repeat(64);
const root=fs.mkdtempSync(path.join(os.tmpdir(),'mahoraga-context-'));
function ctx(openInterest,received,coin='BTC'){
 return {channel:'activeAssetCtx',data:{coin,ctx:{markPx:'100',oraclePx:'100',openInterest:String(openInterest),funding:'0.0001'}}};
}
function trade(time,id,price){
 return P.envelope({kind:'PUBLIC_TRADE',market:'BTC',
 source:{venue:'hyperliquid',feed:'trades',venue_symbol:'BTC',instrument_type:'PERPETUAL'},
 payload:{price,size:1,aggressor_side:'B'},sourceEventMs:time-250,
 receivedWallMs:time,receivedMonotonicMs:id,raw:JSON.stringify({id}),
 rawRef:'synthetic-source-'+id,collectorRunId:'synthetic-capture-01',
 messageId:'trade-'+id,snapshot:false,
 sourceDocumentUrl:'https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions'});
}
try{
 const store=C.open(root,'context-test-01');
 assert.equal(store.ingest(JSON.stringify(ctx(1000,now-20000)),now-20000,1).status,'RECEIPT_ONLY_CONTEXT_ACCEPTED');
 assert.equal(store.ingest(JSON.stringify(ctx(1020,now-1000)),now-1000,2).status,'RECEIPT_ONLY_CONTEXT_ACCEPTED');
 assert.equal(store.health().receipt_only_contexts,2);
 const reloaded=C.open(root,'context-test-01'),contexts=C.read(reloaded.files.context);
 assert.equal(contexts[0].source_event_ms,null);
 assert.equal(contexts[0].source_time_provenance,'RECEIPT_ONLY_NO_EXCHANGE_EVENT_TIMESTAMP');
 assert.equal(contexts[1].available_to_model_ms,now-1000);
 const bucket=Math.floor(now/30000);
 const trades=[];
 for(let k=-4;k<=-1;k++)for(let j=0;j<8;j++)
  trades.push(trade((bucket+k)*30000+5000+j*100,100+(k+4)*8+j,100+j*.001));
 for(let j=0;j<26;j++)trades.push(trade(now-1600+j*20,1000+j,100+j*.002));
 const book=P.envelope({kind:'BOOK_SNAPSHOT',market:'BTC',
  source:{venue:'hyperliquid',feed:'l2Book',venue_symbol:'BTC',instrument_type:'PERPETUAL'},
  payload:{bids:[{px:100,sz:5}],asks:[{px:100.02,sz:4}],best_bid:100,best_ask:100.02,spread_bps:2},
  sourceEventMs:now-1200,receivedWallMs:now-1000,receivedMonotonicMs:300,
  raw:'synthetic-book',rawRef:'synthetic-book-1',collectorRunId:'synthetic-capture-01',
  messageId:'synthetic-book-01',snapshot:true,
  sourceDocumentUrl:'https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions'});
 const result=F.observe([...trades,book],'BTC',now,contexts);
 assert.equal(result.features.observed.length,7);
 assert.equal(result.full_feature_set,true);
 assert.equal(result.features.values.open_interest_change,2);
 assert.equal(result.features.values.funding,.0001);
 assert.ok(result.features.values.volume_ratio>0);
 const noCtx=F.observe([...trades,book],'BTC',now,[]);
 assert.equal(noCtx.full_feature_set,false);
 assert.ok(!noCtx.features.observed.includes('funding'));
 const future={...contexts[1],received_wall_ms:now+10000};
 const futureFiltered=F.observe([...trades,book],'BTC',now,[contexts[0],future]);
 assert.equal(futureFiltered.features.observed.includes('funding'),true);
 assert.equal(futureFiltered.features.observed.includes('open_interest_change'),false);
 fs.appendFileSync(reloaded.files.context,'broken');
 assert.throws(()=>C.open(root,'context-test-02'),/Torn append/);
}finally{fs.rmSync(root,{recursive:true,force:true})}
console.log('MAHORAGA receipt-only provenance and seven-feature mask: positive synthetic sample, future-context exclusion, missingness and restart tamper PASS');
