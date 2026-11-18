'use strict';
// SHORT-LIVED public research capture: BTC L2/trades for 12 seconds, no secrets and no trading.
const fs=require('node:fs'),crypto=require('node:crypto');
const A=require('../data/feed-adapters.cjs'),P=require('../data/provenance.cjs');
const target='mahoraga-public-btc-bounded-events.jsonl',report='mahoraga-public-btc-bounded-health.json';
if(typeof WebSocket!=='function')throw Error('Native WebSocket required');
const started=Date.now(),socket=new WebSocket('wss://api.hyperliquid.xyz/ws');
const state={},counts={BOOK_SNAPSHOT:0,PUBLIC_TRADE:0,quarantined:0,invalid:0},max=500;
let total=0,closed=false;
fs.writeFileSync(target,'',{mode:0o600});
const deadline=setTimeout(()=>finish('TIMED_BOUNDED_COMPLETED'),12000);
function save(kind,item,raw,receivedAt,mono){
 if(total>=max){counts.invalid++;return;}
 const doc=kind==='BOOK_SNAPSHOT'?
   {sourceEventMs:item.sourceEventMs,messageId:'book-'+item.sourceEventMs+'-'+total}:
   {sourceEventMs:item.sourceEventMs,messageId:'trade-'+item.sourceMessageId};
 const event=P.envelope({kind,market:'BTC',
   source:{venue:'hyperliquid',feed:kind==='BOOK_SNAPSHOT'?'l2Book':'trades',
     venue_symbol:'BTC',instrument_type:'PERPETUAL'},
   payload:item.payload,sourceEventMs:doc.sourceEventMs,
   receivedWallMs:receivedAt,receivedMonotonicMs:mono,raw,
   rawRef:'bounded-run-public-btc-'+started+'/'+total,
   collectorRunId:'bounded-'+started,messageId:doc.messageId,reconnectEpoch:0,
   snapshot:kind==='BOOK_SNAPSHOT',
   sourceDocumentUrl:'https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions'});
 const out=P.validateSequence(state,event);
 if(out.status!=='RESEARCH_ACCEPTED_NOT_TRAINING_APPROVED'){counts.quarantined++;return;}
 fs.appendFileSync(target,JSON.stringify(event)+'\n');
 counts[kind]++;total++;
}
function finish(reason){
 if(closed)return;closed=true;clearTimeout(deadline);
 try{socket.close();}catch{}
 const health={status:counts.BOOK_SNAPSHOT>0?'BOUNDED_CAPTURE_PASS_NOT_CONTINUOUS':'BOUNDED_CAPTURE_NOT_VERIFIED',
  reason,duration_ms:Date.now()-started,counts,events_persisted:total,
  raw_storage:'temporary GitHub Actions artifact, not durable historical archive',
  evidence_training_eligible:false,live_trading_enabled:false,
  feed_completeness_proven:false,profitability_proven:false,
  reliability_proven:false,websocket_reconnection_tested:false};
 fs.writeFileSync(report,JSON.stringify(health,null,2)+'\n');
 console.log(JSON.stringify(health));
 if(counts.BOOK_SNAPSHOT===0)process.exitCode=1;
}
socket.addEventListener('open',()=>{
 for(const type of ['l2Book','trades'])
  socket.send(JSON.stringify({method:'subscribe',subscription:{type,coin:'BTC'}}));
});
socket.addEventListener('message',ev=>{
 if(closed)return;
 const received=Date.now(),mono=performance.now(),raw=String(ev.data);
 try{
  const msg=JSON.parse(raw);
  if(msg.channel==='l2Book'){
   const b=A.book(msg);if(b.coin==='BTC')save('BOOK_SNAPSHOT',b,raw,received,mono);
  }else if(msg.channel==='trades'){
   for(const row of A.trades(msg))if(row.coin==='BTC')save('PUBLIC_TRADE',row,raw,received,mono);
  }
 }catch(e){counts.invalid++;if(counts.invalid<4)console.error('BAD_PUBLIC_FRAME',e.message);}
});
socket.addEventListener('error',()=>finish('PUBLIC_WEBSOCKET_ERROR'));
socket.addEventListener('close',()=>finish('DISCONNECTED_BEFORE_DEADLINE'));
