#!/usr/bin/env node
/* INVO v7.3 experimental public-candle collector. No account keys, no orders.
 * Store only new forward candidate journal observations from the actual run.
 * Baseline v6.9 collector is not modified by this separate process.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const R=require('./collect.cjs'),F=require('./v7-paper.cjs');
const BAR=300000,ROOT=path.resolve(__dirname,'..');
async function fetchMarket(coin,from,end){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),25000);
 try{
  const r=await fetch('https://api.hyperliquid.xyz/info',{method:'POST',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({type:'candleSnapshot',req:{coin,interval:'5m',startTime:from,endTime:end-1}}),
   signal:controller.signal});
  if(!r.ok)throw Error('Public market API '+r.status);
  return R.check(await r.json(),coin,end);
 }finally{clearTimeout(timeout)}
}
async function main(){
 const reg=JSON.parse(fs.readFileSync(path.join(ROOT,'research/v7-registration.json'),'utf8'));
 const dest=path.join(ROOT,'research/v7-paper-journal.json');
 const state=fs.existsSync(dest)?JSON.parse(fs.readFileSync(dest,'utf8')):F.init(reg,Date.now());
 const now=Date.now(),end=Math.floor(now/BAR)*BAR,from=end-900*BAR;
 const R2=require('./run.cjs');
 const signal=R2.strategyFromWebsite(fs.readFileSync(path.join(ROOT,'index.html'),'utf8'));
 const results={};
 // All-or-nothing across both markets. Failure never overwrites a valid prior journal.
 for(const pair of reg.preregistered_pairs){
  const bars=await fetchMarket(pair.coin,from,end);
  results[pair.coin]=F.update(state,pair.coin,bars,signal,Date.now(),reg);
 }
 const summary=F.summarize(state,reg);
 fs.writeFileSync(dest,JSON.stringify(state,null,2)+'\n');
 fs.writeFileSync(path.join(ROOT,'research/v7-paper-summary.json'),JSON.stringify(summary,null,2)+'\n');
 console.log('INVO v7.3 EXPERIMENTAL paper evidence',JSON.stringify({results,summary}));
 return summary;
}
if(require.main===module)main().catch(e=>{console.error('EXPERIMENTAL ONLY:',e.message);process.exitCode=1});
module.exports={main};
