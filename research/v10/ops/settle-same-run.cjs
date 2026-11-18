#!/usr/bin/env node
'use strict';
// Public-only, SAME-RUN maturity. Keeps original 20s source receipt on same runner;
// avoids GitHub Actions artifact GET permissions. No backfill, orders or profit claim.
const fs=require('node:fs'),path=require('node:path');
const F=require('../forward/forward.cjs'),R=require('../forward/registration.json');
const M=require('./maturity.cjs');
const dir=path.resolve(process.env.MAHORAGA_FORWARD_OUT||'/tmp/mahoraga-v108-capture');
const load=n=>fs.readFileSync(path.join(dir,n),'utf8');
const original=load('capture-receipt.json'),hash=load('capture-receipt.sha256').trim().split(/\s+/)[0];
if(F.hash(original)!==hash)throw Error('Original capture receipt hash invalid');
const capture=JSON.parse(original),frames=JSON.parse(load('selected-public-frames.json'));
if(capture.run_id!==(process.env.GITHUB_RUN_ID||null))throw Error('Same-run capture ID mismatch');
const state=M.init(capture,frames);
let sealed=false,ws=null,connectAttempts=0,socketFailures=0;
let wakeTimer=null,deadlineTimer=null,retryTimer=null,heartbeat=null;
const trades=capture.observations.filter(x=>x.side!=='NONE');
const observations=capture.observations;
const lastHorizon=Math.max(0,...observations.map(o=>o.mature_after_ms));
const lastDeadline=Math.max(0,...trades.map(o=>o.mature_after_ms+R.exit_tolerance_ms));
const maxEnd=Math.max(lastHorizon,lastDeadline);
function writeOnce(name,body){
 const target=path.join(dir,name);
 fs.writeFileSync(target,body,{flag:'wx',mode:0o600});
}
function finish(reason,now=Date.now()){
 if(sealed)return;
 if(now<maxEnd && trades.some(o=>!state.labels.has(o.id))){
   // Never backdate missing outcomes when disconnected before maturity cutoff.
   scheduleFinish(maxEnd+50);return;
 }
 if(now<lastHorizon){scheduleFinish(lastHorizon+50);return}
 sealed=true;
 for(const timer of [wakeTimer,deadlineTimer,retryTimer,heartbeat])if(timer)clearTimeout(timer);
 try{ws?.close()}catch{}
 const {result,audit}=M.finalize(state,now,reason);
 const text=JSON.stringify(result,null,2)+'\n';
 const sources=JSON.stringify(result.exitSources,null,2)+'\n';
 const checked=JSON.stringify({...audit,source_receipt_sha256:hash,collector_source_run:capture.run_id,
   collector_frames_seen:capture.source_frames_seen,public_socket_connect_attempts:connectAttempts,
   public_socket_failures:socketFailures,research_only:true,training_eligible:false,
   actual_fills_verified:false,profitability_verified:false,scheduled_runner_reliability_verified:false,
   approved_for_live:false},null,2)+'\n';
 writeOnce('outcomes.json',text);
 writeOnce('maturity-exit-frames.json',sources);
 writeOnce('maturity-audit.json',checked);
 writeOnce('maturity-SHA256SUMS.txt',[
   F.hash(text)+'  outcomes.json',F.hash(sources)+'  maturity-exit-frames.json',
   F.hash(checked)+'  maturity-audit.json'
 ].join('\n')+'\n');
 console.log(JSON.stringify({kind:'MAHORAGA_V109_SAME_RUN_MATURITY',run:capture.run_id,
   observations:observations.length,labels:audit.matched_labels,
   paper_reference_without_funding:audit.paper_ex_funding,
   no_trade:audit.abstentions_labeled,missing:audit.missing_data_labels,
   failures:socketFailures,approved_for_live:false,profitability_verified:false,reason}));
}
function scheduleFinish(ts){
 if(sealed)return;
 if(deadlineTimer)clearTimeout(deadlineTimer);
 deadlineTimer=setTimeout(()=>finish('MATURITY_WINDOW_EXPIRED'),Math.max(0,ts-Date.now()));
}
function disconnect(reason){
 if(sealed)return;
 socketFailures++;
 try{ws?.close()}catch{}
 ws=null;
 if(Date.now()>lastDeadline)return;
 if(retryTimer)clearTimeout(retryTimer);
 // Fixed bounded retry; no reinterpretation of late source as on-time.
 const delay=Math.min(15000,1000*2**Math.min(socketFailures,4));
 console.log(JSON.stringify({kind:'PUBLIC_QUOTE_RETRY',reason,after_ms:delay,
   no_backfill:true,approved_for_live:false}));
 retryTimer=setTimeout(connect,delay);
}
function connect(){
 if(sealed||Date.now()>lastDeadline)return;
 connectAttempts++;
 try{ws=new WebSocket('wss://api.hyperliquid.xyz/ws')}
 catch(e){disconnect('SOCKET_CONSTRUCTION_FAILED');return}
 const local=ws;
 let lost=false;
 local.addEventListener('open',()=>{
   if(sealed||local!==ws)return;
   try{
     for(const o of trades.filter(x=>!state.labels.has(x.id)))
       local.send(JSON.stringify({method:'subscribe',subscription:{type:'l2Book',coin:o.market}}));
   }catch{disconnect('SUBSCRIPTION_FAILED')}
 });
 local.addEventListener('message',e=>{
   if(sealed||local!==ws)return;
   const now=Date.now(),raw=String(e.data);
   const result=M.ingest(state,raw,now,Date.now());
   if(result.status==='CAUSAL_PAPER_QUOTE_ACCEPTED')
     console.log(JSON.stringify({kind:'PAPER_REFERENCE_RECEIVED',market:result.market,at_ms:now,
       funding_included:false,trade_executed:false}));
   if(trades.every(x=>state.labels.has(x.id))){
     if(deadlineTimer)clearTimeout(deadlineTimer);
     scheduleFinish(Math.max(lastHorizon,Date.now())+25);
   }
 });
 const lostConnection=reason=>{
  if(lost||sealed||local!==ws)return;
  lost=true;disconnect(reason);
 };
 local.addEventListener('error',()=>lostConnection('SOCKET_ERROR'));
 local.addEventListener('close',()=>lostConnection('SOCKET_CLOSED'));
}
// If this run started after its registered evaluation window, do not reconnect
// or generate artificial quotes: finalize missing entries with actual wall-clock.
const now=Date.now();
if(!observations.length)finish('NO_PRECOMMITTED_OBSERVATIONS',now);
else{
 scheduleFinish(maxEnd+100);
 if(trades.length){
   const soon=Math.min(...trades.map(x=>x.mature_after_ms));
   if(now>lastDeadline){
     console.log('Maturity deadline missed; all unresolved trade labels explicitly MISSING_DATA');
   }else if(now>=soon-10000)connect();
   else wakeTimer=setTimeout(connect,soon-10000-now);
 }
 console.log(JSON.stringify({kind:'MAHORAGA_MATURITY_AWAITING',
    registered_observations:observations.length,earliest_ms:Math.min(...observations.map(x=>x.mature_after_ms)),
    latest_deadline_ms:maxEnd,live_orders:false,training_eligible:false}));
}
