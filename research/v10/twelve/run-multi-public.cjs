#!/usr/bin/env node
'use strict';
// Bounded read-only public BTC/ETH/SOL pilot; no credentials, orders, trained signals, or daemon.
const fs=require('node:fs'),path=require('node:path');
const {controller}=require('../runtime/controller.cjs');
const {verify}=require('./archive.cjs');
if(!process.argv.includes('--research-only')||typeof WebSocket!=='function')
 throw Error('Explicit research-only Node native WebSocket required');
const duration=12000,root=path.resolve('mahoraga-multimarket-public-pilot');
const markets=['BTC','ETH','SOL'];
const c=Object.fromEntries(markets.map(m=>[m,controller(path.join(root,m),{
 runId:'public-multi-'+m+'-'+Date.now(),market:m,maxFrames:40000,maxSeconds:30})]));
const socket=new WebSocket('wss://api.hyperliquid.xyz/ws');
let ended=false,open=false,invalid=0;
function finish(reason){
 if(ended)return;ended=true;clearTimeout(timer);
 try{socket.close();}catch{}
 const stats={schema:'invo-v10-multi-public-smoke-1',reason,
  markets:{},invalid_transport_frames:invalid,
  continuously_running:false,persistent_external_storage:false,
  training_eligible:false,profitability_verified:false,real_orders:false};
 let observed=0;
 for(const m of markets){
  c[m].stop('BOUNDED_'+reason);
  stats.markets[m]=c[m].health().stored;
  observed+=stats.markets[m].accepted;
  if(stats.markets[m].frames){const manifest=verify(path.join(root,m));stats.markets[m].archive_manifest_files=Object.keys(manifest.files).length;}
 }
 fs.writeFileSync(path.join(root,'smoke-report.json'),JSON.stringify(stats,null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify(stats));
 if(!observed||reason!=='TIME_BOUNDED')process.exitCode=1;
}
const timer=setTimeout(()=>finish('TIME_BOUNDED'),duration);
socket.addEventListener('open',()=>{
 try{
  for(const m of markets)c[m].onConnected();
  open=true;
  for(const m of markets)for(const type of ['l2Book','trades'])
   socket.send(JSON.stringify({method:'subscribe',subscription:{type,coin:m}}));
 }catch(err){console.error('PUBLIC_SUBSCRIBE',err.message);finish('SUBSCRIBE_FAILURE')}
});
socket.addEventListener('message',ev=>{
 if(ended||!open)return;
 const raw=String(ev.data);
 try{
  const msg=JSON.parse(raw);
  const market=msg.channel==='l2Book'?msg.data?.coin:
   msg.channel==='trades'&&Array.isArray(msg.data)&&msg.data.length?msg.data[0].coin:null;
  if(!markets.includes(market))return;
  c[market].onMessage(raw,Date.now(),performance.now());
 }catch(e){invalid++;if(invalid<3)console.error('FRAME_REJECTED',e.message)}
});
socket.addEventListener('error',()=>finish('SOCKET_ERROR'));
socket.addEventListener('close',()=>finish('SOCKET_CLOSED'));
