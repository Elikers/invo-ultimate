'use strict';
/* v9.0: retrospective decomposition of frozen v6.1 trades. No data capture, signal changes or trades. */
const C=require('../../v61-core.js');
function diagnose(bars,trades){
 if(!C.valid(bars)||!Array.isArray(trades))throw Error('Invalid immutable trade replay');
 const reasons={};const sides={LONG:[],SHORT:[]};
 for(const t of trades){
  if(!['LONG','SHORT'].includes(t.side)||!Number.isFinite(t.grossPct)||
     !Number.isInteger(t.signalIndex)||!Number.isInteger(t.exitIndex)||
     t.exitIndex>=bars.length||t.exitIndex<t.signalIndex)throw Error('Invalid trade provenance');
  (reasons[t.reason]??=[]).push(t.grossPct);
  sides[t.side].push(t.grossPct);
 }
 const bucket=items=>({count:items.length,gross_avg_pct:items.length?items.reduce((s,v)=>s+v,0)/items.length:null,
  gross_positive_count:items.filter(x=>x>0).length});
 const gross=trades.map(x=>x.grossPct);
 const grossMean=bucket(gross).gross_avg_pct;
 const costs=[0,8,16,24,40].map(bps=>({bps,net_mean_pct:grossMean===null?null:grossMean-bps/100,
   net_positive_trades:trades.filter(t=>t.grossPct>bps/100).length}));
 return {schema:'invo-v9.0-frozen-loss-decomposition-1',trades:trades.length,
  break_even_cost_bps:grossMean===null?null:grossMean*100,
  exit_reasons:Object.fromEntries(Object.entries(reasons).map(([k,v])=>[k,bucket(v)])),
  side:Object.fromEntries(Object.entries(sides).map(([k,v])=>[k,bucket(v)])),
  costs,kind:'RETROSPECTIVE_DIAGNOSTIC_NOT_FORWARD',
  caveats:['Frozen fills do not respond to altered fees or market impact.',
   'Positive gross simulated return is not executable profit.',
   'No per-regime causal explanation without independent forward verification.']};
}
module.exports={diagnose};
