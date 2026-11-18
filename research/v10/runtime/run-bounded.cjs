#!/usr/bin/env node
'use strict';
// Explicitly opt-in BOUNDED public collector. Not an always-on deployment, not scheduled,
// no wallet or order interfaces. Research data written only to caller-supplied local path.
const fs=require('node:fs'),path=require('node:path');
const {controller}=require('./controller.cjs');
const args=process.argv.slice(2);
const get=key=>{const i=args.indexOf(key);return i<0?null:args[i+1]};
if(!args.includes('--public-data-only')||args.some(x=>/wallet|private|api.key|order|leverage/i.test(x)))
 throw Error('Use public-data-only mode; private/trading flags forbidden');
const seconds=Number(get('--duration-seconds')),dir=get('--dir');
if(!Number.isSafeInteger(seconds)||seconds<5||seconds>3600||!path.isAbsolute(dir))
 throw Error('Require --duration-seconds 5..3600 and an absolute --dir');
if(typeof WebSocket!=='function')throw Error('Native WebSocket missing');
const runId='public-'+Date.now();
const c=controller(dir,{runId,maxSeconds:seconds,maxFrames:100000});
const started=Date.now();let socket=null,closing=false,attempts=0,backoff=null;
let connected=false,lastMessage=Date.now(),reconnectFailure=0;
const deadline=setTimeout(()=>stop('TIME_BOUND'),seconds*1000);
const watcher=setInterval(()=>{
 if(closing)return;
 if(socket&&connected&&Date.now()-lastMessage>20000)socket.close(1000,'stale public data');
},5000);
function stop(reason){
 if(closing)return;
 closing=true;clearTimeout(deadline);clearInterval(watcher);if(backoff)clearTimeout(backoff);
 try{socket?.close();}catch{}
 const health=c.stop(reason);
 console.log(JSON.stringify({kind:'MAHORAGA_BOUNDED_RESEARCH_CAPTURE_STOPPED',reason,
  elapsed_ms:Date.now()-started,health,no_orders:true,persistent_service_deployed:false}));
 if(health.stored.accepted===0)process.exitCode=1;
}
function retry(reason){
 if(closing)return;
 if(connected){c.onDisconnect(reason);connected=false;}
 reconnectFailure++;if(reconnectFailure>20){stop('RECONNECT_RETRIES_EXCEEDED');return;}
 const wait=Math.min(15000,500*Math.pow(2,Math.min(5,reconnectFailure-1)));
 backoff=setTimeout(connect,wait);
}
function connect(){
 if(closing||Date.now()-started>=seconds*1000){stop('TIME_BOUND');return}
 let ws;
 try{ws=new WebSocket('wss://api.hyperliquid.xyz/ws')}catch(e){retry('CONSTRUCTOR_ERROR');return}
 socket=ws;let settled=false;
 ws.addEventListener('open',()=>{
  if(closing||ws!==socket)return;
  try{
   c.onConnected();connected=true;lastMessage=Date.now();attempts++;reconnectFailure=0;
   for(const coin of ['BTC','ETH','SOL'])for(const type of ['l2Book','trades'])
    ws.send(JSON.stringify({method:'subscribe',subscription:{type,coin}}));
  }catch(err){console.error('PUBLIC_CONNECT_REJECTED',err.message);retry('SUBSCRIBE_ERROR')}
 });
 ws.addEventListener('message',evt=>{
  if(closing||ws!==socket||!connected)return;
  lastMessage=Date.now();
  try{
   const outcome=c.onMessage(String(evt.data),lastMessage,performance.now());
   if(outcome.status.startsWith('QUARANTINED'))console.error('FRAME_QUARANTINED',outcome.status);
  }catch(e){console.error('RESEARCH_CAPTURE_FAIL_CLOSED',e.message);stop('INGEST_ERROR')}
 });
 const lost=reason=>{
  if(settled||closing||ws!==socket)return;settled=true;retry(reason);
 };
 ws.addEventListener('close',()=>lost('SOCKET_CLOSE'));
 ws.addEventListener('error',()=>lost('SOCKET_ERROR'));
}
process.on('SIGINT',()=>stop('SIGINT'));
process.on('SIGTERM',()=>stop('SIGTERM'));
connect();
