'use strict';
// One-shot PUBLIC websocket smoke; no private API, no account, no daemon, no writes.
const A=require('../data/feed-adapters.cjs');
if(typeof WebSocket!=='function')throw Error('Native WebSocket runtime unavailable');
const start=Date.now();
const socket=new WebSocket('wss://api.hyperliquid.xyz/ws');
let done=false;
const timer=setTimeout(()=>finish(new Error('No usable BTC l2Book event before timeout')),26000);
function finish(err,result){
 if(done)return;done=true;clearTimeout(timer);
 try{socket.close();}catch{}
 if(err){console.error('MAHORAGA_PUBLIC_WS_SMOKE_BLOCKED',err.message);process.exitCode=1;}
 else console.log(JSON.stringify({...result,storage_persisted:false,continuous_stream_claimed:false,orders_sent:false}));
}
socket.addEventListener('open',()=>{
 try{socket.send(JSON.stringify({method:'subscribe',subscription:{type:'l2Book',coin:'BTC'}}));}
 catch(e){finish(e);}
});
socket.addEventListener('error',()=>finish(new Error('Public websocket transport failed')));
socket.addEventListener('message',ev=>{
 try{
  const x=JSON.parse(String(ev.data));if(x.channel!=='l2Book')return;
  const p=A.book(x);
  if(p.coin!=='BTC'||!Number.isFinite(p.payload.spread_bps))throw Error('Bad public book');
  finish(null,{status:'PASS_PUBLIC_WEBSOCKET_ONE_EVENT',
    coin:p.coin,source_event_timestamp_present:true,
    book_age_ms:Date.now()-p.sourceEventMs,
    observed_spread_bps:p.payload.spread_bps,
    connection_elapsed_ms:Date.now()-start});
 }catch(e){finish(e);}
});
