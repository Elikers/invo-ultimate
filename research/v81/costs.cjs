/* INVO v8.1 — read-only trade-level cost audit and scenario stress testing.
 * Does NOT modify the production simulator. No real exchange-fee claims.
 */
'use strict';
const C=require('../../v61-core.js');
const RISK_PCT=1;
const SCENARIOS=Object.freeze({
  zero:{entry_fee_bps:0,exit_fee_bps:0,entry_slippage_bps:0,exit_slippage_bps:0,spread_bps:0,funding_bps:0},
  optimistic:{entry_fee_bps:2,exit_fee_bps:2,entry_slippage_bps:1,exit_slippage_bps:1,spread_bps:2,funding_bps:0},
  base:{entry_fee_bps:4,exit_fee_bps:4,entry_slippage_bps:2,exit_slippage_bps:2,spread_bps:4,funding_bps:0},
  stressed:{entry_fee_bps:8,exit_fee_bps:8,entry_slippage_bps:6,exit_slippage_bps:6,spread_bps:8,funding_bps:4},
  severe:{entry_fee_bps:12,exit_fee_bps:12,entry_slippage_bps:15,exit_slippage_bps:15,spread_bps:16,funding_bps:8}
});
function allInBps(s){
 if(!s||Object.keys(SCENARIOS.base).some(k=>!Number.isFinite(s[k])||s[k]<0))throw Error('Incomplete nonnegative execution cost configuration');
 return Object.values(s).reduce((a,b)=>a+b,0);
}
function ledger(trades,scenario){
 const bps=allInBps(scenario);
 if(!Array.isArray(trades))throw Error('Missing frozen trade ledger');
 return trades.map(t=>{
  if(!Number.isFinite(t.grossPct)||!Number.isFinite(t.entry)||t.entry<=0||
      !Number.isInteger(t.entryIndex)||!Number.isInteger(t.exitIndex)||t.exitIndex<t.entryIndex)
    throw Error('Malformed simulator trade');
  const netPct=t.grossPct-bps/100;
  return {...t,cost_bps:bps,netPct,net_R:netPct/RISK_PCT};
 });
}
function summarize(trades,s){
 const l=ledger(trades,s),core=C.summary(l);
 const total=l.length,meanR=total?l.reduce((sum,t)=>sum+t.net_R,0)/total:null;
 const timeBars=total?l.reduce((sum,t)=>sum+t.exitIndex-t.entryIndex+1,0)/total:null;
 const reasonCounts={};
 for(const t of l)reasonCounts[t.reason]=(reasonCounts[t.reason]||0)+1;
 return {...core,mean_net_R:meanR,mean_hold_bars:timeBars,reason_counts:reasonCounts,
   scenario_cost_bps:allInBps(s),source:'FROZEN_CANDLE_SIMULATOR_REPRICED_NOT_EXECUTABLE'};
}
function evaluate(trades){
 return {schema:'invo-v8.1-cost-ledger-1',model:'HYPOTHETICAL_FIXED_BPS_NOT_EXCHANGE_OBSERVED',
   risk_assumption_pct:RISK_PCT,
   results:Object.fromEntries(Object.entries(SCENARIOS).map(([id,s])=>[id,summarize(trades,s)])),
   warnings:['Illustrative fees, spread, slippage and funding are scenario assumptions, NOT measured or venue verified.',
     'Funding modeled as flat bps per trade, NOT real funding timing/sign.',
     'Slippage and spread are fixed-price adjustments, not a market impact, orderbook or liquidation simulation.',
     'Cost re-pricing of unchanged fills does not change stop/target triggers or account for stop-out feedback.',
     'Does not include unrealized positions, investor cashflows, execution delay, capital usage or portfolio exposure.',
     'Historical analysis only; does not establish profitable strategy or forward evidence.']};
}
module.exports={SCENARIOS,allInBps,ledger,summarize,evaluate};
