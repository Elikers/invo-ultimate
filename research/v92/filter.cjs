'use strict';
const R=require('../v81/regimes.cjs'),P=require('./registration.json');
function classify(bars,signalIndex,originalSide,observedAt){
 if(!['LONG','SHORT','NONE'].includes(originalSide)||!Number.isFinite(observedAt)||observedAt<=Date.parse(P.not_before_utc))
  throw Error('Not preregistered forward observation');
 if(!Number.isInteger(signalIndex)||!Array.isArray(bars)||!bars[signalIndex]||
  observedAt<bars[signalIndex].t+300000)throw Error('Future completed bar or invalid index');
 const r=R.classifyPriorToEntry(bars,signalIndex);if(!r)throw Error('Missing completed past regime');
 const admitted=originalSide!=='NONE'&&r.volatility==='NORMAL'&&
  ((originalSide==='LONG'&&r.trend==='UP')||(originalSide==='SHORT'&&r.trend==='DOWN'));
 return {schema:'invo-v9.2-observation-1',original_side:originalSide,
  accepted_for_shadow_comparison:admitted,regime:r.trend,volatility:r.volatility,
  signal_bar_t:bars[signalIndex].t,signal_observed_at:observedAt,
  baseline_counted:true,shadow_trade_created:false,kind:'FUTURE_OBSERVATIONAL_HYPOTHESIS_ONLY'};
}
function tally(observations){
 if(!Array.isArray(observations))throw Error('Missing observations');
 const eligible=observations.filter(x=>x.original_side!=='NONE');
 if(eligible.some(x=>x.baseline_counted!==true||typeof x.accepted_for_shadow_comparison!=='boolean'))
  throw Error('Missing matched baseline or skipped signals');
 return {total_baseline_signals:eligible.length,shadow_accepted:eligible.filter(x=>x.accepted_for_shadow_comparison).length,
  shadow_rejected:eligible.filter(x=>!x.accepted_for_shadow_comparison).length,
  trade_pnl:null,promotion_allowed:false};
}
module.exports={classify,tally};
