'use strict';
// One-shot public Hyperliquid info API capability check. NO keys, no orders, no storage, no daemon.
const assert=require('node:assert/strict');
const A=require('../data/feed-adapters.cjs');
async function post(body){
 const ctrl=new AbortController(),tid=setTimeout(()=>ctrl.abort(),12000);
 try{const resp=await fetch('https://api.hyperliquid.xyz/info',{
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:ctrl.signal});
 if(!resp.ok)throw Error('PUBLIC_INFO_HTTP_'+resp.status);
 return resp.json();}finally{clearTimeout(tid);}
}
(async()=>{
 const start=Date.now();
 const book=await post({type:'l2Book',coin:'BTC'});
 if(!book||!Array.isArray(book.levels)||book.levels.length!==2||!Number.isSafeInteger(book.time))
  throw Error('PUBLIC_BOOK_CONTRACT_MISMATCH');
 const fakeWS={channel:'l2Book',data:{coin:'BTC',time:book.time,levels:book.levels}};
 const p=A.book(fakeWS);assert(p.payload.spread_bps>=0);
 const meta=await post({type:'metaAndAssetCtxs'});
 if(!Array.isArray(meta)||meta.length!==2||!Array.isArray(meta[0]?.universe)||!Array.isArray(meta[1]))
  throw Error('PUBLIC_META_CONTEXT_CONTRACT_MISMATCH');
 const idx=meta[0].universe.findIndex(x=>x.name==='BTC');
 if(idx<0||!meta[1][idx])throw Error('BTC_CONTEXT_UNAVAILABLE');
 const c=meta[1][idx];
 for(const f of ['markPx','oraclePx','openInterest','funding'])
  if(!Number.isFinite(Number(c[f])))throw Error('MISSING_'+f);
 console.log(JSON.stringify({status:'PUBLIC_READ_ONLY_SMOKE_PASS',
  market:'BTC',venues:['hyperliquid'],feeds:['l2Book via public HTTP','metaAndAssetCtxs'],
  book_exchange_timestamp_known:true,book_age_ms:Date.now()-book.time,
  spread_bps:p.payload.spread_bps,elapsed_ms:Date.now()-start,
  persisted_raw_market_data:false,continuous_websocket_tested:false,
  trading_credentials_used:false,orders_submitted:false,
  source:'Hyperliquid public info API'}));
})().catch(e=>{console.error('PUBLIC_READ_ONLY_SMOKE_BLOCKED',e.message);process.exitCode=1});
