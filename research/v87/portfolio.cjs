'use strict';
// v8.7 descriptive concurrent portfolio risk; never places or resizes orders.
function exposure(positions,equityUsd){
 if(!Array.isArray(positions)||!Number.isFinite(equityUsd)||equityUsd<=0)throw Error('Invalid hypothetical portfolio');
 const events=[];
 for(const p of positions){
  if(!['BTC','ETH','SOL','JUP'].includes(p.market)||
   !Number.isSafeInteger(p.start_ms)||!Number.isSafeInteger(p.end_ms)||p.end_ms<=p.start_ms||
   !Number.isFinite(p.notional_usd)||p.notional_usd<=0||
   !Number.isFinite(p.stop_pct)||p.stop_pct<=0)throw Error('Invalid hypothetical position');
  const risk=p.notional_usd*p.stop_pct/100;
  events.push({t:p.start_ms,weight:p.notional_usd,risk,market:p.market,start:true});
  events.push({t:p.end_ms,weight:-p.notional_usd,risk:-risk,market:p.market,start:false});
 }
 // Close positions before opening at the same timestamp: no double count at boundary.
 events.sort((a,b)=>a.t-b.t||Number(a.start)-Number(b.start));
 let gross=0,stopRisk=0,peakGross=0,peakStopRisk=0,peakMarkets=0;
 const openByMarket=new Map();
 for(const e of events){
  gross+=e.weight;stopRisk+=e.risk;
  openByMarket.set(e.market,(openByMarket.get(e.market)||0)+(e.start?1:-1));
  peakGross=Math.max(peakGross,gross);peakStopRisk=Math.max(peakStopRisk,stopRisk);
  peakMarkets=Math.max(peakMarkets,[...openByMarket.values()].filter(n=>n>0).length);
 }
 return {schema:'invo-v8.7-hypothetical-crowding-1',positions:positions.length,
  peak_gross_notional_over_equity:peakGross/equityUsd,
  peak_simultaneous_stop_risk_pct_equity:peakStopRisk/equityUsd*100,
  peak_distinct_markets:peakMarkets,
  status:'DESCRIPTIVE_ONLY_NO_RISK_PARAMETER_CHANGE',
  warnings:['Additive stop risk ignores gaps, correlated jumps, liquidation and bid-ask execution.',
   'Not an estimated VaR or realized portfolio performance; no actual portfolio holdings loaded.',
   'No leverage or size recommendations and no order changes.']};
}
module.exports={exposure};
