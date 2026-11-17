#!/usr/bin/env node
'use strict';
// INVO v6.2: read-only research; no order placement, no secrets, no strategy tuning.
const fs=require('node:fs'),path=require('node:path');
const C=require('../v61-core.js'),F=require('./forward.cjs'),D=require('./diagnose.cjs'),I=require('./integrity.cjs');
const ROOT=path.resolve(__dirname,'..'),BAR=300000;
const COINS=['BTC','ETH','SOL','JUP'],IDS=['fusion','sweep','auction','pullback','volbreak','mean','strict'];
const COSTS=[8,16],HISTORY_BARS=14*288;
function strategyFromWebsite(html){
 const begin=html.indexOf('function agg(bars,n){'),end=html.indexOf('function mark(pos,price){',begin);
 if(begin<0||end<=begin)throw Error('Existing website signal module not found; refusing a substituted model');
 const source=html.slice(begin,end);
 const signal=new Function(source+'\nreturn signal;')();
 for(const id of IDS){if(typeof signal!=='function')throw Error('Site signal not callable');}
 return signal;
}
async function post(body){
 const control=new AbortController(),timer=setTimeout(()=>control.abort(),25000);
 try{
  const response=await fetch('https://api.hyperliquid.xyz/info',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:control.signal});
  if(!response.ok)throw Error('Exchange HTTP '+response.status);
  return await response.json();
 }finally{clearTimeout(timer);}
}
function parse(raw,coin,end){
 if(!Array.isArray(raw))throw Error('Exchange returned no candle array');
 const b=raw.filter(x=>String(x.s||coin)===coin).map(x=>({t:Number(x.t),o:Number(x.o),h:Number(x.h),l:Number(x.l),c:Number(x.c),v:Number(x.v)}))
 .filter(x=>Number.isFinite(x.t)&&x.t+BAR<=end).sort((a,b)=>a.t-b.t);
 if(b.length!==HISTORY_BARS||!C.valid(b))throw Error('Candle count/continuity invalid: '+b.length+'/'+HISTORY_BARS);
 return b;
}
function splitSummary(b,trades){
 const n=b.length,points=[0,Math.floor(n*.5),Math.floor(n*.75),n],names=['train_first_50pct','monitor_next_25pct','holdout_last_25pct'];
 return names.map((name,k)=>{
  const start=points[k],end=points[k+1];
  const data=trades.filter(t=>t.signalIndex>=start+12&&t.entryIndex>=start+12&&t.exitIndex<end);
  return {name,start_utc:new Date(b[start].t).toISOString(),end_utc:new Date(b[end-1].t+BAR).toISOString(),...C.summary(data)};
 });
}
function quality(s){
 const hold=s[2],mid=s[1];
 if(hold.count<20||mid.count<20)return 'INSUFFICIENT_SAMPLES';
 if(!(hold.expectancyPct>0&&mid.expectancyPct>0&&hold.profitFactor!==null&&mid.profitFactor!==null&&hold.profitFactor>1.1&&mid.profitFactor>1.1))return 'NO_POSITIVE_HISTORICAL_EDGE';
 if(hold.maxDrawdownPct>=20||mid.maxDrawdownPct>=20)return 'DRAWDOWN_SCREEN_FAILED';
 return 'HISTORICAL_SCREEN_ONLY_NOT_FORWARD_VALIDATED';
}
function runOne(b,id,signal){
 const signals=Array(b.length).fill(null);
 for(let i=65;i+12<b.length;i++){
  const s=signal(id,b.slice(Math.max(0,i-900),i+1));
  if(s?.side==='LONG'||s?.side==='SHORT')signals[i]={side:s.side};
 }
 return COSTS.map(costBps=>{
  const trades=C.simulate(b,signals,{stopPct:1,targetPct:1.5,costBps,hold:12});
  const folds=splitSummary(b,trades);
  return {strategy:id,cost_bps_round_trip:costBps,trade_count:trades.length,folds,screen:quality(folds)};
 });
}
async function main(){
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8'),signal=strategyFromWebsite(html);
 const end=Math.floor(Date.now()/BAR)*BAR,start=end-HISTORY_BARS*BAR;
 const report={schema:'invo-v6.2-research-1',created_utc:new Date().toISOString(),source:'Hyperliquid public candleSnapshot, 5m completed candles',engine:'Website seven signal rules + shared v6.1 conservative fixed-stop engine',window_start_utc:new Date(start).toISOString(),window_end_utc:new Date(end).toISOString(),settings:{stop_pct:1,take_profit_pct:1.5,max_hold_bars:12,cost_bps_scenarios:COSTS,entry:'next completed signal candle open',simultaneous_stop_target:'stop first',gap_policy:'adverse stop gap uses candle open',lookback_bars:900,folds:'50/25/25 chronological; 12-bar embargo; no selection or fitting'},warnings:['Illustrative returns; no funding, variable spread, slippage, exchange fills or liquidation modeled.','Historical folds are not independent forward/live validation. No model optimization or strategy approval.','Only the exchange recent candle window is used; results are neither future predictions nor recommendations.'],markets:{}};
 const forwardPath=path.join(ROOT,'research/forward-journal.json');
 const previous=fs.existsSync(forwardPath)?JSON.parse(fs.readFileSync(forwardPath,'utf8')):F.init(Date.now());
 const checks={};
 const diagnosis={schema:'invo-v6.4-loss-diagnosis-1',created_utc:report.created_utc,source:'Retrospective historical replay with exact website signals and v6.1 simulator; NOT forward observations',settings:{stop_pct:1,target_pct:1.5,max_hold_bars:12,cost_bps:[0,8,16,24]},markets:{}};
 const meta=await post({type:'meta'});const available=new Set((meta.universe||[]).map(x=>x.name));
 for(const coin of COINS){
  if(!available.has(coin)){report.markets[coin]={status:'UNAVAILABLE_MARKET',reason:'Not listed in default perpetual metadata'};continue;}
  try{
   const raw=await post({type:'candleSnapshot',req:{coin,interval:'5m',startTime:start,endTime:end-1}});
   const bars=parse(raw,coin,end);
   if(bars[0].t!==start||bars.at(-1).t!==end-BAR)throw Error('Requested time window is incomplete');
   const results=[];for(const id of IDS)results.push(...runOne(bars,id,signal));
   report.markets[coin]={status:'ANALYZED',candles:bars.length,results};
   diagnosis.markets[coin]={status:'ANALYZED',...D.market(bars,signal)};
   checks[coin]=F.update(previous,coin,bars,signal,Date.now());
  }catch(e){report.markets[coin]={status:'UNAVAILABLE_DATA',reason:String(e.message||e).slice(0,200)};
    diagnosis.markets[coin]={status:'UNAVAILABLE',reason:String(e.message||e).slice(0,200)};
    if(previous.markets[coin])previous.markets[coin].unavailable_runs++;
  }
 }
 const valid=Object.values(report.markets).filter(x=>x.status==='ANALYZED').length;
 if(!valid)throw Error('No markets had valid complete history; previous report remains unchanged');
 fs.mkdirSync(path.join(ROOT,'research'),{recursive:true});
 report.forward_observation={source_file:'research/forward-summary.json',checks};
 fs.writeFileSync(path.join(ROOT,'research/latest.json'),JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(path.join(ROOT,'research/loss-diagnosis.json'),JSON.stringify(diagnosis,null,2)+'\n');
 fs.writeFileSync(forwardPath,JSON.stringify(previous,null,2)+'\n');
 fs.writeFileSync(path.join(ROOT,'research/forward-summary.json'),JSON.stringify(F.overview(previous),null,2)+'\n');
 const healthPath=path.join(ROOT,'research/collector-health.json');
 const health=fs.existsSync(healthPath)?JSON.parse(fs.readFileSync(healthPath,'utf8')):null;
 fs.writeFileSync(path.join(ROOT,'research/integrity-risk.json'),JSON.stringify(I.build(diagnosis,F.overview(previous),health),null,2)+'\n');
 console.log('Saved research/latest.json:',valid,'markets; all strategies paper-only.');
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={strategyFromWebsite,parse,splitSummary,quality,runOne};
