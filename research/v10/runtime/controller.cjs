'use strict';
// MAHORAGA research-only persistent-session controller. No orders, secrets, or model training.
// One writer per directory, explicit reconnect epochs, durable connection journal and fail-closed restart.
const fs=require('node:fs'),path=require('node:path');
const {open,read}=require('../next/capture.cjs');
const dirMode=0o700;
function syncAppend(file,obj){const fd=fs.openSync(file,'a',0o600);try{
 const text=JSON.stringify(obj)+'\n',n=fs.writeSync(fd,text);if(n!==Buffer.byteLength(text))throw Error('Partial journal write');
 fs.fsyncSync(fd);
}finally{fs.closeSync(fd)}}
function controller(root,{runId,market='BTC',maxFrames=20000,maxSeconds=3600,now=()=>Date.now()}={}){
 if(typeof root!=='string'||!path.isAbsolute(root)||typeof runId!=='string'||!/^[-a-z0-9_]{6,60}$/i.test(runId)||
 !Number.isSafeInteger(maxFrames)||maxFrames<1||maxFrames>500000||
 !Number.isSafeInteger(maxSeconds)||maxSeconds<5||maxSeconds>3600)
 throw Error('Invalid bounded research collector contract');
 fs.mkdirSync(root,{recursive:true,mode:dirMode});
 const lock=path.join(root,'.single-writer.lock');
 let fd;try{fd=fs.openSync(lock,'wx',0o600);fs.writeSync(fd,runId+'\n');fs.fsyncSync(fd);}
 catch(e){if(fd!==undefined)fs.closeSync(fd);throw Error('Collector directory locked: refuse concurrent writer');}
 const file=path.join(root,'connection-health.jsonl');
 let store,entries;
 try{
  entries=read(file);
  let last=-1;
  for(const x of entries){
   if(!Number.isSafeInteger(x.epoch)||x.epoch<0||x.epoch<last||
    !['CONNECTED','DISCONNECTED','STOPPED'].includes(x.state)||
    !Number.isSafeInteger(x.at_ms))throw Error('Invalid connection evidence');
   last=x.epoch;
  }
  store=open(root,runId,market);
 }catch(e){fs.closeSync(fd);fs.unlinkSync(lock);throw e}
 let epoch=entries.length?entries.at(-1).epoch+1:0,connected=false,stopped=false;
 const started=now();let lastReceived=null,received=0,reconnects=0,dropouts=0;
 function journal(state,reason=''){
  const v={epoch,state,at_ms:now(),run_id:runId,reason};
  syncAppend(file,v);entries.push(v);
 }
 function onConnected(){
  if(stopped)throw Error('Stopped research collector');
  if(connected)throw Error('Duplicate socket open');
  if(received>=maxFrames)throw Error('Bounded capacity reached');
  connected=true;journal('CONNECTED');return epoch;
 }
 function onMessage(bytes,receivedAt=now(),monotonic=0){
  if(stopped||!connected)throw Error('No trusted active socket');
  if(receivedAt<started||receivedAt>now()+2000)throw Error('Untrusted receipt time');
  if(received>=maxFrames)throw Error('Bounded capacity reached');
  received++;lastReceived=receivedAt;
  return store.ingest(bytes,receivedAt,monotonic,epoch);
 }
 function onDisconnect(reason){
  if(stopped||!connected)return epoch;
  connected=false;dropouts++;journal('DISCONNECTED',String(reason).slice(0,100));
  epoch++;reconnects++;return epoch;
 }
 function health(){
  const t=now();
  return {schema:'invo-v10-capture-supervisor-1',run_id:runId,epoch,
   uptime_ms:t-started,connected,received_frames:received,
   stored:store.health(),disconnects:dropouts,reconnects,
   stale:!lastReceived||t-lastReceived>10000,
   durable_external_storage_verified:false,always_on:false,
   training_enabled:false,orders_enabled:false,ready_for_forward_eval:false};
 }
 function stop(reason){
  if(stopped)return health();
  if(connected){connected=false;journal('DISCONNECTED','STOP_'+reason)}
  journal('STOPPED',String(reason).slice(0,100));stopped=true;
  const h=health();
  fs.writeFileSync(path.join(root,'last-health.json'),JSON.stringify(h,null,2)+'\n',{mode:0o600});
  fs.closeSync(fd);fs.unlinkSync(lock);
  return h;
 }
 return {onConnected,onMessage,onDisconnect,health,stop,files:store.files,root};
}
module.exports={controller};
