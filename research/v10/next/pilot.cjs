'use strict';
// Optional bounded real-public-data pilot using the new crash-audited capture store.
// No account keys, no trading, no daemon, no recurring workflow, no paid services.
const fs=require('node:fs'),C=require('./capture.cjs');
const root='mahoraga-gate1-bounded-capture',store=C.open(root,'bounded-public-01');
if(typeof WebSocket!=='function')throw Error('Node native WebSocket required');
const socket=new WebSocket('wss://api.hyperliquid.xyz/ws');
const start=Date.now();let epoch=0,ended=false;
const stop=reason=>{
 if(ended)return;ended=true;clearTimeout(timer);
 try{socket.close()}catch{}
 const health={status:store.health().accepted>0?'BOUNDED_RESEARCH_CAPTURE_PASS':'NO_ACCEPTED_EVENTS',
  reason,elapsed_ms:Date.now()-start,...store.health(),continuous_runtime:false,
  source:'public Hyperliquid BTC L2/trades',training_approved:false};
 fs.writeFileSync(root+'/pilot-health.json',JSON.stringify(health,null,2)+'\n');
 console.log(JSON.stringify(health));
 if(!store.health().accepted)process.exitCode=1;
};
const timer=setTimeout(()=>stop('12_SECOND_TIME_LIMIT'),12000);
socket.addEventListener('open',()=>{
 for(const type of ['l2Book','trades'])
  socket.send(JSON.stringify({method:'subscribe',subscription:{type,coin:'BTC'}}));
});
socket.addEventListener('message',ev=>{
 if(ended)return;
 const raw=String(ev.data),recv=Date.now(),mono=performance.now();
 const result=store.ingest(raw,recv,mono,epoch);
 if(result.status.startsWith('QUARANTINED'))console.error('QUARANTINE',result.status);
});
socket.addEventListener('error',()=>stop('PUBLIC_WS_ERROR'));
socket.addEventListener('close',()=>stop('DISCONNECTED'));
