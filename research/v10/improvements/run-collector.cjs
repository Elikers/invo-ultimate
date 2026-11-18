#!/usr/bin/env node
'use strict';
// MANUAL, BOUNDED, PUBLIC-ONLY research data collector. Never scheduled; no private API, no orders.
// Example: node research/v10/improvements/run-collector.cjs --public-data-only --duration-seconds 60 --dir /tmp/mahoraga
const fs=require('node:fs'),path=require('node:path'),{Collector}=require('./collector.cjs');
const argv=process.argv.slice(2),get=flag=>argv[argv.indexOf(flag)+1];
if(!argv.includes('--public-data-only')||!argv.includes('--duration-seconds')||
 !argv.includes('--dir'))throw Error('Explicit public-only mode, duration and output directory required');
if(argv.some(x=>/wallet|order|private|leverage|api-key/i.test(x)))throw Error('Trading/private options prohibited');
const duration=Number(get('--duration-seconds')),folder=get('--dir');
if(!Number.isInteger(duration)||duration<5||duration>3600||!path.isAbsolute(folder))
 throw Error('Bounded [5,3600] seconds and absolute output directory required');
if(typeof WebSocket!=='function')throw Error('Native WebSocket unavailable');
const collector=new Collector(folder,{maxEvents:100000,maxAgeMs:180000});
const healthFile=path.join(folder,'health.json');
const finishAt=Date.now()+duration*1000;let sock=null,stopped=false,reconnectTimer=null,attempt=0;
function health(){const result={...collector.summary(),updated_utc:new Date().toISOString(),
 duration_limit_sec:duration,source:'hyperliquid public WebSocket',actual_orders:0,
 persistent_cloud_deployment:false};
 const tmp=healthFile+'.tmp';fs.writeFileSync(tmp,JSON.stringify(result,null,2)+'\n',{mode:0o600});fs.renameSync(tmp,healthFile);
 return result;
}
function stop(reason){
 if(stopped)return;stopped=true;
 if(reconnectTimer)clearTimeout(reconnectTimer);
 try{sock?.close();}catch{}
 const summary=health();console.log(JSON.stringify({status:'BOUNDED_PUBLIC_RESEARCH_STOPPED',reason,health:summary}));
}
function reconnect(){
 if(stopped||Date.now()>=finishAt){stop('TIME_LIMIT');return;}
 const wait=Math.min(12000,1000*2**Math.min(4,attempt++));
 collector.disconnect();health();
 reconnectTimer=setTimeout(connect,wait);
}
function connect(){
 if(stopped||Date.now()>=finishAt){stop('TIME_LIMIT');return;}
 let settled=false;
 try{sock=new WebSocket('wss://api.hyperliquid.xyz/ws');}
 catch(e){console.error('WS_CREATE_FAILED',e.message);reconnect();return;}
 const thisSocket=sock;
 thisSocket.addEventListener('open',()=>{
  attempt=0;
  for(const type of ['l2Book','trades','activeAssetCtx']){
   try{thisSocket.send(JSON.stringify({method:'subscribe',subscription:{type,coin:'BTC'}}));}
   catch(e){console.error('WS_SUBSCRIPTION_REJECTED',e.message);}
  }
 });
 thisSocket.addEventListener('message',ev=>{
  if(stopped||thisSocket!==sock)return;
  const result=collector.ingest(String(ev.data),{receivedWallMs:Date.now(),receivedMonotonicMs:performance.now()});
  if(result==='CAPACITY_STOP'){stop('MAX_EVENTS');return;}
  if(collector.health.observed%50===0)health();
 });
 const lost=()=>{if(settled||stopped||thisSocket!==sock)return;settled=true;reconnect();};
 thisSocket.addEventListener('close',lost);
 thisSocket.addEventListener('error',lost);
}
const until=setTimeout(()=>stop('TIME_LIMIT'),duration*1000);
process.on('SIGINT',()=>{clearTimeout(until);stop('SIGINT')});
process.on('SIGTERM',()=>{clearTimeout(until);stop('SIGTERM')});
connect();
