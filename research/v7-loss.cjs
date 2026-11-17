/* INVO v7.0: observed delayed-paper loss attribution; no order or strategy mutations. */
'use strict';
const COINS=['BTC','ETH','SOL','JUP'];
const STRATEGIES=['fusion','sweep','auction','pullback','volbreak','mean','strict'];
const COSTS=[8,16,24];
const mean=x=>x.length?x.reduce((a,b)=>a+b,0)/x.length:null;
function diagnose(journal,now=new Date().toISOString()){
 if(journal?.schema!=='invo-v6.3-forward-1')throw Error('Unexpected forward journal');
 const rows=COINS.flatMap(coin=>(journal.markets?.[coin]?.observations||[]).map(x=>({...x,coin})));
 const closed=rows.filter(x=>x.status==='CLOSED');
 const outcomes={},exits={},byStrategy={};
 for(const x of closed){
  const gross=x.gross_pct;
  if(typeof gross!=='number'||!Number.isFinite(gross))throw Error('Missing validated paper gross P/L');
  const category=gross<=0?'PRICE_MOVEMENT_NONPOSITIVE':gross<=.08?'COST_ERASES_GROSS_AT_8BPS':gross<=.16?'COST_ERASES_GROSS_AT_16BPS':'GROSS_EXCEEDS_16BPS';
  outcomes[category]=(outcomes[category]||0)+1;
  const reason=x.reason||'UNKNOWN';
  const reasonRows=exits[reason]||(exits[reason]=[]);
  reasonRows.push(gross);
  const key=x.coin+'|'+x.strategy;
  (byStrategy[key]||(byStrategy[key]=[])).push(x);
 }
 const costResults={};
 for(const cost of COSTS){
  const values=closed.map(x=>x.gross_pct-cost/100);
  costResults[String(cost)]={closed:values.length,mean_net_pct:mean(values),winning:values.filter(x=>x>0).length,
   losing:values.filter(x=>x<0).length,sum_net_pct:values.length?values.reduce((a,b)=>a+b,0):null};
 }
 return {schema:'invo-v7.0-loss-attribution-1',created_utc:now,forward_updated_utc:journal.updated_utc,
  closed:closed.length,unfinished:rows.length-closed.length,
  outcomes,exit_reasons:Object.fromEntries(Object.entries(exits).map(([key,val])=>[key,{count:val.length,mean_gross_pct:mean(val)}])),
  by_market_strategy:Object.fromEntries(Object.entries(byStrategy).map(([key,val])=>[key,{closed:val.length,mean_gross_pct:mean(val.map(x=>x.gross_pct))}])),
  fixed_cost_stress_bps:costResults,diagnostic_limits:[
   'Exit reason is an observed simulator outcome, not proof of causal failure or a better alternative entry.',
   'No intrabar execution, bid-ask spread, market impact or realized fees; 8/16/24 bps are stress assumptions.',
   'Forward paper journal contains trades captured only at actual collector observations. No missed entries reconstructed.'
  ]};
}
module.exports={diagnose,COINS,STRATEGIES,COSTS};
