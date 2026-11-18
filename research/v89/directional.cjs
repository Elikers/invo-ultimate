'use strict';
/* v8.9 EXPERIMENTAL forward directional outcomes only.
 * No entry fill, costs, PnL, stop/target, orders, or retrospective signal discovery.
 * Inputs must arrive at true observation time; replayed historical observations are rejected.
 */
const BAR=300000,HORIZON=3*BAR;
const COINS=['BTC','ETH','SOL','JUP'];
function begin(reg,now){
 if(reg?.schema!=='invo-v7.3-prospective-registration-1'||!Number.isFinite(Date.parse(reg.registered_utc))||
  !Number.isFinite(now)||now<Date.parse(reg.registered_utc))throw Error('Invalid registered experiment');
 return {schema:'invo-v8.9-directional-forward-1',registered_utc:reg.registered_utc,
  initialized_at_utc:new Date(now).toISOString(),predictions:[],
  evidence:'FUTURE_CLOSE_DIRECTIONAL_LABEL_ONLY_NOT_TRADE_PNL'};
}
function record(state,reg,bars,market,strategy,side,now){
 if(state.schema!=='invo-v8.9-directional-forward-1'||state.registered_utc!==reg.registered_utc)
  throw Error('Immutable registration mismatch');
 if(!COINS.includes(market)||!['LONG','SHORT','NONE'].includes(side)||
  !reg.preregistered_pairs.some(p=>p.coin===market&&p.strategy===strategy))throw Error('Unregistered prediction');
 if(!Number.isFinite(now)||now<=Date.parse(reg.registered_utc))throw Error('Retrospective observation time');
 if(!Array.isArray(bars)||!bars.length)throw Error('No completed candles');
 const last=bars.at(-1),end=Math.floor(now/BAR)*BAR;
 if(!Number.isSafeInteger(last.t)||last.t!==end-BAR||!Number.isFinite(last.c)||last.c<=0)
  throw Error('Most recent completed bar missing; no delayed signal replay');
 if(side==='NONE')return {status:'NO_SIGNAL'};
 const id=market+'|'+strategy+'|'+last.t;
 if(state.predictions.some(x=>x.id===id))return {status:'DUPLICATE_IGNORED'};
 const x={id,market,strategy,side,signal_bar_t:last.t,
  observed_at_utc:new Date(now).toISOString(),reference_close:last.c,
  reference_close_provenance:'LAST_COMPLETED_BAR_NOT_EXECUTABLE_FILL',
  target_close_t:end+HORIZON,status:'PENDING'};
 state.predictions.push(x);
 return {status:'RECORDED_PROSPECTIVELY',target_close_t:x.target_close_t};
}
function settle(state,bars,market,now){
 if(!Number.isFinite(now)||!Array.isArray(bars))throw Error('Invalid settlement data');
 let closed=0,unresolved=0;
 for(const p of state.predictions){
  if(p.market!==market||p.status!=='PENDING'||now<p.target_close_t)continue;
  if(now<=Date.parse(p.observed_at_utc))throw Error('Outcome not later than prediction');
  const target=bars.find(b=>b.t===p.target_close_t-BAR);
  if(!target||!Number.isFinite(target.c)||target.c<=0||target.t+BAR>now){
   p.status='UNRESOLVED_MISSING_TARGET_CANDLE';unresolved++;continue;
  }
  const signed=(p.side==='LONG'?1:-1);
  p.target_close=target.c;
  p.price_change_pct=100*(target.c/p.reference_close-1);
  p.directional_score_pct=signed*p.price_change_pct;
  p.status='SCORED_DIRECTION_ONLY';
  p.scored_at_utc=new Date(now).toISOString();
  closed++;
 }
 return {closed_directional_scores:closed,unresolved};
}
function summary(state){
 const completed=state.predictions.filter(p=>p.status==='SCORED_DIRECTION_ONLY');
 return {schema:'invo-v8.9-directional-summary-1',
  total_predictions:state.predictions.length,scored:completed.length,
  pending:state.predictions.filter(p=>p.status==='PENDING').length,
  unresolved:state.predictions.filter(p=>p.status==='UNRESOLVED_MISSING_TARGET_CANDLE').length,
  mean_directional_score_pct:completed.length?completed.reduce((s,p)=>s+p.directional_score_pct,0)/completed.length:null,
  execution_pnl:null,forward_trading_edge_approved:false,
  disclaimer:'Only future realized close direction relative to previously observed closed-candle reference. No fills, cost treatment or strategy profitability.'};
}
module.exports={BAR,HORIZON,begin,record,settle,summary};
