/* INVO v7.1 preregistered, bounded historical research. NO production changes.
 * Exactly two previously visible market-strategy pairs and two challenger exit variants.
 */
'use strict';
const C=require('../v61-core.js');
const BAR=300000;
const PAIRS=Object.freeze([{coin:'JUP',strategy:'volbreak'},{coin:'SOL',strategy:'pullback'}]);
const SETTINGS=Object.freeze([
 {id:'BASELINE_FROZEN',stopPct:1,targetPct:1.5,hold:12},
 {id:'CANDIDATE_SHORTER_TIME_EXIT',stopPct:1,targetPct:1.5,hold:8},
 {id:'CANDIDATE_TIGHTER_STOP',stopPct:.8,targetPct:1.5,hold:12}
]);
const folds=['first_50pct','next_25pct','last_25pct'];
function splits(b,trades,cost){
 const pts=[0,Math.floor(b.length*.5),Math.floor(b.length*.75),b.length];
 return folds.map((name,i)=>{
  const rows=trades.filter(t=>t.signalIndex>=pts[i]+12&&t.entryIndex>=pts[i]+12&&t.exitIndex<pts[i+1]);
  return {name,start_utc:new Date(b[pts[i]].t).toISOString(),end_utc:new Date(b[pts[i+1]-1].t+BAR).toISOString(),
   ...C.summary(rows.map(x=>({netPct:x.grossPct-cost/100})))};
 });
}
function evaluate(b,coin,signal){
 if(!C.valid(b))throw Error('Invalid or discontinuous research candles');
 const pair=PAIRS.find(p=>p.coin===coin);
 if(!pair)throw Error('Market not in preregistered research budget');
 const signals=Array(b.length).fill(null);
 for(let i=65;i+12<b.length;i++){
  const s=signal(pair.strategy,b.slice(Math.max(0,i-900),i+1));
  if(s?.side==='LONG'||s?.side==='SHORT')signals[i]={side:s.side};
 }
 const candidates=SETTINGS.map(o=>{
  const trades=C.simulate(b,signals,{...o,costBps:0});
  const byCost=Object.fromEntries([8,16,24].map(cost=>[String(cost),{
   full:C.summary(trades.map(x=>({netPct:x.grossPct-cost/100}))),
   folds:splits(b,trades,cost)}]));
  return {id:o.id,settings:{stop_pct:o.stopPct,target_pct:o.targetPct,hold_bars:o.hold},
   by_cost_bps:byCost,trade_count:trades.length};
 });
 return {coin,strategy:pair.strategy,start_utc:new Date(b[0].t).toISOString(),
  end_utc:new Date(b.at(-1).t+BAR).toISOString(),candles:b.length,
  candidates,assessment:'RETROSPECTIVE_DIAGNOSTIC_ONLY_NO_WINNER_SELECTION',
  warning:'The pairs and historical period were already inspected. No historical fold is an independent untouched lockbox; candidate results are not deployable.'};
}
module.exports={evaluate,splits,PAIRS,SETTINGS};
