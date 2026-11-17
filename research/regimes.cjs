/* INVO v6.6 — descriptive market regimes and entry diagnostics.
 * Uses only prior or current completed 5m bars at signal time.
 * No website strategies, stop/target settings, or order execution changes.
 */
'use strict';
const C=require('../v61-core.js');
const IDS=['fusion','sweep','auction','pullback','volbreak','mean','strict'];
const BAR=300000,MAX_HOLD=12,LOOKBACK=900;
const net=rows=>C.summary(rows.map(t=>({netPct:t.grossPct-.08})));
const pct=(a,b)=>(a/b-1)*100;
function regime(b,i){
 if(i<64) return null;
 const past=b.slice(i-63,i+1),prev=b[i-24].c,last=b[i].c;
 // Regimes are predeclared descriptive thresholds, NOT fitted to evaluation returns.
 const trend=pct(last,prev);
 const ranges=past.slice(-24).map(x=>x.h-x.l);
 const avgRange=ranges.reduce((a,x)=>a+x,0)/ranges.length/last*100;
 const vol=avgRange>=.55?'HIGH_VOL':avgRange<.18?'LOW_VOL':'MID_VOL';
 const direction=trend>1?'UP_TREND':trend< -1?'DOWN_TREND':'RANGE';
 return {direction,volatility:vol,trend_2h_pct:trend,mean_range_2h_pct:avgRange};
}
function tag(b,trades){
 const groups={},exits={},falseBreakouts=0,targets=0;
 for(const t of trades){
  const meta=regime(b,t.signalIndex);if(!meta)continue;
  const key=meta.direction+'|'+meta.volatility;
  (groups[key]||=[]).push(t);
  (exits[t.reason]||=[]).push(t);
  if(t.reason==='STOP'||t.reason==='STOP_GAP'||t.reason==='STOP_BOTH')falseBreakouts++;
  if(t.reason==='TARGET')targets++;
 }
 return {
  grouped:Object.fromEntries(Object.entries(groups).map(([key,rows])=>[key,{...net(rows),sample_warning:rows.length<20?'INSUFFICIENT_SUBGROUP_SAMPLE':null}])),
  exit_reasons:Object.fromEntries(Object.entries(exits).map(([key,rows])=>[key,{count:rows.length,...net(rows)}])),
  stop_exit_count:falseBreakouts,target_exit_count:targets,
  caution:'Stop exits are adverse outcomes, NOT proof of false breakouts or bad signal timing.'
 };
}
function classify(b){
 if(!C.valid(b))throw Error('5m candles invalid');
 const counts={};for(let i=64;i<b.length;i++){const x=regime(b,i),key=x.direction+'|'+x.volatility;counts[key]=(counts[key]||0)+1;}
 return counts;
}
function study(b,signal){
 if(!C.valid(b))throw Error('5m candles invalid');
 const strategies={};
 const points=[0,Math.floor(b.length*.5),Math.floor(b.length*.75),b.length];
 for(const id of IDS){
  const signals=Array(b.length).fill(null);
  for(let i=65;i+MAX_HOLD<b.length;i++){
   const s=signal(id,b.slice(Math.max(0,i-LOOKBACK),i+1));
   if(s?.side==='LONG'||s?.side==='SHORT')signals[i]={side:s.side};
  }
  const trades=C.simulate(b,signals,{stopPct:1,targetPct:1.5,costBps:0,hold:MAX_HOLD});
  const periods=['first_50pct','middle_25pct','last_25pct'].map((name,k)=>{
   const start=points[k],end=points[k+1];
   const rows=trades.filter(t=>t.signalIndex>=start+MAX_HOLD&&t.entryIndex>=start+MAX_HOLD&&t.exitIndex<end);
   return {name,...tag(b,rows),total:net(rows)};
  });
  strategies[id]={historical_trades:trades.length,periods,entire_window:tag(b,trades),
    validation:'HISTORICAL_SEGMENTATION_ONLY_NOT_INDEPENDENT_FORWARD_TEST',
    risk_of_selection:'Selecting best-performing regimes from this report and evaluating on the same window is data snooping.'};
 }
 return {status:'ANALYZED',candles:b.length,start_utc:new Date(b[0].t).toISOString(),
  end_utc:new Date(b.at(-1).t+BAR).toISOString(),regime_candle_counts:classify(b),strategies};
}
module.exports={regime,classify,tag,study};
