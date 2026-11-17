#!/usr/bin/env node
'use strict';
// v6.3 lightweight, 15-minute GitHub Actions collector; NO exchange orders.
const fs=require('node:fs'),path=require('node:path');
const C=require('../v61-core.js'),F=require('./forward.cjs'),R=require('./run.cjs');
const ROOT=path.resolve(__dirname,'..');
const COINS=['BTC','ETH','SOL','JUP'],BAR=F.BAR,WINDOW=900;
async function post(body){
 let last;
 for(let attempt=0;attempt<3;attempt++){
  const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),25000);
  try{
   const res=await fetch('https://api.hyperliquid.xyz/info',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:abort.signal});
   if(!res.ok)throw Error('Exchange HTTP '+res.status);
   return await res.json();
  }catch(e){last=e;if(attempt<2)await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));}
  finally{clearTimeout(timeout);}
 }
 throw last;
}
function check(raw,coin,end){
 if(!Array.isArray(raw))throw Error('No candle data');
 const b=raw.filter(x=>String(x.s||coin)===coin).map(x=>({t:Number(x.t),o:Number(x.o),h:Number(x.h),l:Number(x.l),c:Number(x.c),v:Number(x.v)}))
 .filter(x=>Number.isFinite(x.t)&&x.t+BAR<=end).sort((a,b)=>a.t-b.t);
 if(b.length!==WINDOW||!C.valid(b)||b[0].t!==end-WINDOW*BAR||b.at(-1).t!==end-BAR)throw Error('Incomplete or invalid 900-bar window');
 return b;
}
async function main(){
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8'),signal=R.strategyFromWebsite(html);
 const saved=path.join(ROOT,'research/forward-journal.json');
 const state=fs.existsSync(saved)?JSON.parse(fs.readFileSync(saved,'utf8')):F.init(Date.now());
 const end=Math.floor(Date.now()/BAR)*BAR,from=end-WINDOW*BAR;
 const available=new Set((await post({type:'meta'})).universe?.map(x=>x.name)||[]);
 const results={},sampled_at_utc=new Date().toISOString();
 const action_event=process.env.GITHUB_EVENT_NAME||'LOCAL_OR_UNKNOWN';
 const action_run_id=process.env.GITHUB_RUN_ID||null;
 let complete=0;
 for(const coin of COINS){
  if(!available.has(coin)){results[coin]={status:'MARKET_NOT_LISTED'};continue;}
  try{
   const raw=await post({type:'candleSnapshot',req:{coin,interval:'5m',startTime:from,endTime:end-1}});
   const b=check(raw,coin,end);
   const update=F.update(state,coin,b,signal,Date.now());
   results[coin]={status:'OK',...update,last_processed_completed_candle_t:state.markets[coin].last_processed_t+BAR};
   complete++;
  }catch(e){
   if(state.markets[coin])state.markets[coin].unavailable_runs++;
   results[coin]={status:'UNAVAILABLE',reason:String(e.message||e).slice(0,150)};
  }
 }
 if(!complete){
  const out=path.join(ROOT,'research');
  fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'collector-health.json'),JSON.stringify({
   schema:'invo-v6.3-collector-health-1',observed_utc:sampled_at_utc,status:'FAILED_NO_COMPLETE_MARKETS',action_event,action_run_id,
   processed_markets:0,expected_markets:COINS.length,expected_completed_candle_t:end,results,
   note:'Heartbeat records failure, not successful market processing. Last valid journal intentionally preserved.'
  },null,2)+'\n');
  throw Error('No complete markets: last valid journal protected; failed heartbeat written as workflow artifact');
 }
 const out=path.join(ROOT,'research');
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(saved,JSON.stringify(state,null,2)+'\n');
 fs.writeFileSync(path.join(out,'forward-summary.json'),JSON.stringify(F.overview(state),null,2)+'\n');
 fs.writeFileSync(path.join(out,'collector-health.json'),JSON.stringify({
  schema:'invo-v6.3-collector-health-1',observed_utc:sampled_at_utc,action_event,action_run_id,mode:'15-minute poll; not real-time',processed_markets:complete,expected_markets:COINS.length,expected_completed_candle_t:end,results,
  note:'A healthy check with zero signals is not a failed collector. Missing scheduled runs are visible as an aging observed_utc timestamp.'
 },null,2)+'\n');
 console.log('v6.3 collector result:',JSON.stringify({time:sampled_at_utc,processed_markets:complete,results}));
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={check};
