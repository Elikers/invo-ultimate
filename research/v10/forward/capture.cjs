#!/usr/bin/env node
'use strict';
// Short bounded PUBLIC L2 intake. No wallets, order/trading endpoints, credentials or daemons.
// GitHub Actions artifact is a provisional evidence receipt, not independent immutable attestation.
const fs=require('node:fs'),path=require('node:path'),F=require('./forward.cjs'),R=require('./registration.json');
const out=path.resolve(process.env.MAHORAGA_FORWARD_OUT||'/tmp/mahoraga-forward-v103');
const allowed=R.markets;
if(typeof WebSocket!=='function')throw Error('Node native WebSocket required');
fs.mkdirSync(out,{recursive:true,mode:0o700});
const started=Date.now(),observations=[],gaps=[],received={},frameHashes={};
const runId=process.env.GITHUB_RUN_ID||null;
const ws=new WebSocket('wss://api.hyperliquid.xyz/ws');
let finished=false,errors=0,total=0;
function done(reason){
 if(finished)return;finished=true;clearTimeout(timer);
 try{ws.close()}catch{}
 const now=Date.now();
 for(const market of allowed)
  if(!observations.some(x=>x.market===market))
    gaps.push(F.gap(market,now,now<F.START?'REGISTRATION_NOT_ACTIVE':'NO_FRESH_VALID_L2'));
 const report={schema:'mahoraga-v103-capture-receipt-v1',
   run_id:runId,registration_sha256:F.hash(R),started_at_ms:started,
   ended_at_ms:now,venue:R.venue,reason,
   observations,gaps,received_by_market:received,frame_sha_by_market:frameHashes,
   source_frames_seen:total,invalid_frames:errors,
   authenticated_future_outcomes:0,verified_profit: false,
   independent_external_attestation:false,training_eligible:false,
   live_orders:false,auto_promotion:false,producer:'BOUNDED_PUBLIC_WEBSOCKET'};
 const text=JSON.stringify(report,null,2)+'\n';
 fs.writeFileSync(path.join(out,'capture-receipt.json'),text,{mode:0o600});
 fs.writeFileSync(path.join(out,'capture-receipt.sha256'),F.hash(text)+'  capture-receipt.json\n',{mode:0o600});
 console.log(JSON.stringify({run_id:runId,reason,observed:observations.map(x=>({market:x.market,
    side:x.side,decision_time_ms:x.decision_time_ms})),
   gaps:gaps.map(x=>({market:x.market,reason:x.reason})),
   frames:total,errors,live_orders:false,verified_profit:false}));
 if(total===0)process.exitCode=2;
}
const timer=setTimeout(()=>done('BOUNDED_CAPTURE_COMPLETED'),20000);
ws.addEventListener('open',()=>{
 for(const coin of allowed)
  ws.send(JSON.stringify({method:'subscribe',subscription:{type:'l2Book',coin}}));
});
ws.addEventListener('message',ev=>{
 if(finished)return;total++;const raw=String(ev.data),at=Date.now();
 let coin;
 try{
  const j=JSON.parse(raw);if(j.channel!=='l2Book')return;
  coin=j.data?.coin;if(!allowed.includes(coin))return;
  received[coin]=(received[coin]||0)+1;
  frameHashes[coin]=F.hash(raw);
  if(observations.some(x=>x.market===coin)||at<F.START)return;
  observations.push(F.propose(raw,at,Date.now()));
 }catch(e){errors++;if(errors<4)console.error('QUARANTINED_PUBLIC_FRAME',e.message);}
 if(observations.length===allowed.length)done('ALL_MARKETS_RECORDED_ONCE');
});
ws.addEventListener('error',()=>done('PUBLIC_WS_ERROR'));
ws.addEventListener('close',()=>done('PUBLIC_WS_DISCONNECTED'));
process.on('SIGTERM',()=>done('SIGTERM'));
