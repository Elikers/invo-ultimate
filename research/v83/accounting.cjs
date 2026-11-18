'use strict';
// v8.3 accounting: explicit cost evidence provenance, no synthetic numbers called "actual".
const C=require('../../v61-core.js');
const COST_FIELDS=['entry_fee_bps','exit_fee_bps','spread_bps','slippage_bps','funding_bps'];
function evaluate(closedTrades,execution){
 if(!Array.isArray(closedTrades)||!execution)throw Error('Missing trade/cost evidence');
 const sources=execution.sources||{};
 const trusted=Object.values(sources).every(x=>x?.verified===true&&typeof x?.source==='string'&&x.source.length>3);
 if(COST_FIELDS.some(f=>!Number.isFinite(execution[f])||execution[f]<0))throw Error('Missing nonnegative cost components');
 const total=COST_FIELDS.reduce((v,f)=>v+execution[f],0);
 const repriced=closedTrades.map(t=>{
  if(!Number.isFinite(t.grossPct)||!Number.isFinite(t.entry)||t.entry<=0||!Number.isFinite(t.exit)||t.exit<=0)
   throw Error('Invalid frozen hypothetical trade');
  return {...t,netPct:t.grossPct-total/100};
 });
 const s=C.summary(repriced);
 return {schema:'invo-v8.3-execution-accounting-1',trade_count:repriced.length,all_in_bps:total,
  evidence:trusted&&COST_FIELDS.every(f=>sources[f]?.verified)?'COST_COMPONENTS_SOURCE_VERIFIED':'COST_SCENARIO_UNVERIFIED',
  simulated_accounting:s,actual_portfolio_pnl:null,actual_fills_verified:false,
  warnings:['Repriced hypothetical trade gross returns: stop/target and fill prices are unchanged.',
   'Verified fee sources alone do not prove actual traded fills, funding timing, spreads, or strategy profitability.',
   'Open positions, cashflow and liquidation remain unavailable without an authenticated position ledger.']};
}
module.exports={evaluate,COST_FIELDS};
