#!/usr/bin/env node
/* INVO v8.9 public-candle prospective DIRECTIONAL observation runner.
 * Uses only a currently observed, completed 5m signal; no historical signal replay.
 * No exchange orders, accounts, real fills, stop/target changes, or portfolio PnL.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),D=require('./directional.cjs');
const C=require('../../v61-core.js'),R=require('../run.cjs');
const BAR=300000;
async function market(coin,end){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),25000);
 try{
  const r=await fetch('https://api.hyperliquid.xyz/info',{method:'POST',
   headers:{'Content-Type':'application/json'},signal:controller.signal,
   body:JSON.stringify({type:'candleSnapshot',req:{coin,interval:'5m',startTime:end-900*BAR,endTime:end-1}})});
  if(!r.ok)throw Error('Public market HTTP '+r.status);
  const raw=await r.json();
  if(!Array.isArray(raw))throw Error('Unexpected public candle response');
  const bars=raw.filter(x=>String(x.s||coin)===coin).map(x=>({t:Number(x.t),o:Number(x.o),h:Number(x.h),l:Number(x.l),c:Number(x.c),v:Number(x.v)}))
   .filter(x=>Number.isSafeInteger(x.t)&&x.t+BAR<=end).sort((a,b)=>a.t-b.t);
  if(bars.length!==900||!C.valid(bars)||bars.at(-1).t!==end-BAR||bars[0].t!==end-900*BAR)
   throw Error('Incomplete 900-bar completed candle window');
  return bars;
 }finally{clearTimeout(timeout)}
}
async function main(){
 const args=process.argv.slice(2),dry=args.includes('--dry-run');
 const production=args.find(x=>x.startsWith('--production='))?.slice(13)||path.resolve(__dirname,'../..');
 const root=path.resolve(__dirname,'../..');
 const reg=JSON.parse(fs.readFileSync(path.join(production,'research/v7-registration.json'),'utf8'));
 const html=fs.readFileSync(path.join(production,'index.html'),'utf8');
 const signal=R.strategyFromWebsite(html);
 const stateFile=path.join(root,'evidence/v89-directional-ledger.json');
 const healthFile=path.join(root,'evidence/v89-directional-health.json');
 const now=Date.now(),end=Math.floor(now/BAR)*BAR;
 if(!reg.preregistered_pairs||reg.preregistered_pairs.length!==2)throw Error('Unrecognized frozen pair list');
 const fetched={};
 for(const pair of reg.preregistered_pairs)fetched[pair.coin]=await market(pair.coin,end);
 // Any data fetch failure above is all-or-nothing. Never partially publish.
 const state=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile,'utf8')):D.begin(reg,now);
 const report={schema:'invo-v8.9-directional-poll-1',observed_utc:new Date(now).toISOString(),
  observations:[],mode:dry?'DRY_RUN_NO_FILES':'APPEND_ONLY_DIRECTIONAL_PREDICTIONS',
  warning:'Directional observation only, no executable prices, actual profit or filled orders.'};
 for(const pair of reg.preregistered_pairs){
  const bars=fetched[pair.coin],scored=D.settle(state,bars,pair.coin,now);
  const s=signal(pair.strategy,bars),side=s?.side==='LONG'||s?.side==='SHORT'?s.side:'NONE';
  const added=D.record(state,reg,bars,pair.coin,pair.strategy,side,now);
  report.observations.push({coin:pair.coin,strategy:pair.strategy,signal:side,
   source_last_completed_bar_t:bars.at(-1).t,scored,added});
 }
 report.summary=D.summary(state);
 if(!dry){
  fs.mkdirSync(path.dirname(stateFile),{recursive:true});
  fs.writeFileSync(stateFile,JSON.stringify(state,null,2)+'\n');
  fs.writeFileSync(healthFile,JSON.stringify(report,null,2)+'\n');
 }
 console.log(JSON.stringify(report,null,2));
}
if(require.main===module)main().catch(e=>{console.error('V89_PROSPECTIVE_REJECTED:',e.message);process.exitCode=1});
module.exports={market};
