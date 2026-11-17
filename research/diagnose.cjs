/* INVO v6.4 — retrospective loss diagnosis. Research-only, identical strategy signals and v6.1 accounting. */
'use strict';
const C=require('../v61-core.js'),I=require('./integrity.cjs');
const IDS=['fusion','sweep','auction','pullback','volbreak','mean','strict'];
const COSTS=[0,8,16,24];
function finite(x){return typeof x==='number'&&Number.isFinite(x)}
function explain(b,id,signal){
 if(!C.valid(b))throw Error('Invalid or discontinuous candle history');
 if(!IDS.includes(id))throw Error('Unknown strategy');
 const signals=Array(b.length).fill(null);
 for(let i=65;i+12<b.length;i++){
  const s=signal(id,b.slice(Math.max(0,i-900),i+1));
  if(s&&['LONG','SHORT'].includes(s.side))signals[i]={side:s.side};
 }
 const base=C.simulate(b,signals,{stopPct:1,targetPct:1.5,costBps:0,hold:12});
 const byCost=Object.fromEntries(COSTS.map(cost=>[String(cost),C.summary(base.map(x=>({netPct:x.grossPct-cost/100})))]));
 const exitReasons={};
 for(const t of base){
  const cur=exitReasons[t.reason]||{count:0,grossPctSum:0};
  cur.count++;cur.grossPctSum+=t.grossPct;exitReasons[t.reason]=cur;
 }
 const exits=Object.fromEntries(Object.entries(exitReasons).map(([key,val])=>[key,{count:val.count,avg_gross_pct:val.grossPctSum/val.count}]));
 const side={};
 for(const s of ['LONG','SHORT']){const t=base.filter(x=>x.side===s);side[s]={...C.summary(t.map(x=>({netPct:x.grossPct-0.08}))),count:t.length};}
 const n=b.length,bounds=[0,Math.floor(n*.5),Math.floor(n*.75),n];
 const period=['first_50pct','middle_25pct','last_25pct'].map((name,k)=>{
  const start=bounds[k],end=bounds[k+1];
  const rows=base.filter(x=>x.signalIndex>=start+12&&x.entryIndex>=start+12&&x.exitIndex<end);
  return {name,start_utc:new Date(b[start].t).toISOString(),end_utc:new Date(b[end-1].t+300000).toISOString(),...C.summary(rows.map(x=>({netPct:x.grossPct-0.08})))};
 });
 const avgGross=base.length?base.reduce((sum,x)=>sum+x.grossPct,0)/base.length:null;
 return {strategy:id,closed_trades:base.length,avg_gross_pct:avgGross,break_even_round_trip_cost_bps:avgGross===null?null:avgGross*100,
  stress_bps:byCost,exit_reasons:exits,side,period,
  risk_8bps:I.streaks(base,8),
  status:base.length<60||period[2].count<20?'INSUFFICIENT_RESEARCH_SAMPLE':'RETROSPECTIVE_ONLY_NOT_FORWARD_VALIDATED'};
}
function market(b,signal){return {candles:b.length,start_utc:new Date(b[0].t).toISOString(),end_utc:new Date(b.at(-1).t+300000).toISOString(),strategies:Object.fromEntries(IDS.map(id=>[id,explain(b,id,signal)]))};}
module.exports={explain,market,COSTS,IDS};
