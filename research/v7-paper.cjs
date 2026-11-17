/* INVO v7.3 - independent EXPERIMENTAL forward paper ledger.
 * The v6.9 journal, strategy source and risk settings remain untouched.
 * Never backfills missed signals, submits orders or calls an exchange account API.
 */
'use strict';
const C=require('../v61-core.js'),BAR=300000,MAX=600;
const iso=t=>new Date(t).toISOString();
function init(reg,now){
 if(reg?.schema!=='invo-v7.3-prospective-registration-1')throw Error('Unknown frozen registration');
 return {schema:'invo-v7.3-candidate-paper-1',registered_utc:reg.registered_utc,
  initialized_utc:iso(now),updated_utc:iso(now),markets:{},
  warning:'Separate forward-only experimental delayed PAPER journal; no actual fills, no historical signal backfill, no production changes.'};
}
function variants(reg){return [{id:'BASELINE_FROZEN',...{stop_pct:reg.baseline.stop_pct,target_pct:reg.baseline.target_pct,hold_bars:reg.baseline.hold_bars}},...reg.candidates]}
function evaluate(x,b){
 const dir=x.side==='LONG'?1:-1,s=x.entry*(1-dir*x.stop_pct/100),t=x.entry*(1+dir*x.target_pct/100);
 if((dir===1&&b.o<=s)||(dir===-1&&b.o>=s))return {exit:b.o,reason:'STOP_GAP'};
 const stop=dir===1?b.l<=s:b.h>=s,target=dir===1?b.h>=t:b.l<=t;
 if(stop)return {exit:s,reason:target?'STOP_BOTH':'STOP'};
 if(target)return {exit:t,reason:'TARGET'};
 if(b.t>=x.entry_t+BAR*(x.hold_bars-1))return {exit:b.c,reason:'TIME'};
 return null;
}
function update(j,coin,b,signal,now,reg){
 if(j?.schema!=='invo-v7.3-candidate-paper-1'||j.registered_utc!==reg.registered_utc)throw Error('Registration mismatch');
 if(!C.valid(b))throw Error('Invalid completed 5m data');
 if(!Number.isFinite(now)||now<b.at(-1).t+BAR||now<Date.parse(reg.registered_utc))throw Error('Invalid observation time');
 const pair=reg.preregistered_pairs.find(x=>x.coin===coin);if(!pair)throw Error('Unregistered market');
 const last=b.at(-1).t,first=b[0].t;let m=j.markets[coin];
 if(!m){m={last_processed_t:last,last_signal_bar_t:last,observations:[],gaps:0};j.markets[coin]=m;j.updated_utc=iso(now);return {initialized:true,new_signals:0,closed:0};}
 if(m.last_processed_t>last)throw Error('Market candle history reversed');
 if(m.last_processed_t+BAR<first){
  m.gaps++;
  for(const x of m.observations)if(['PENDING','OPEN'].includes(x.status)){x.status='UNRESOLVED_GAP';x.reason='MISSING_CANDLES'}
  m.last_processed_t=last;m.last_signal_bar_t=last;j.updated_utc=iso(now);
  return {gap:true,new_signals:0,closed:0};
 }
 let closed=0,expired=0;
 for(const bar of b){
  if(bar.t<=m.last_processed_t)continue;
  for(const x of m.observations){
   if(x.status==='PENDING'&&bar.t>=x.entry_t){
    if(bar.t!==x.entry_t){x.status='EXPIRED';x.reason='MISSED_PLANNED_ENTRY';expired++;continue}
    x.entry=bar.o;x.status='OPEN';x.entered_at_utc=iso(bar.t);
   }
   if(x.status!=='OPEN'||bar.t<x.entry_t)continue;
   const out=evaluate(x,bar);
   if(out){
    x.exit=out.exit;x.exit_t=bar.t+BAR;x.reason=out.reason;x.status='CLOSED';
    x.gross_pct=(x.side==='LONG'?1:-1)*(x.exit-x.entry)/x.entry*100;
    x.net_pct=Object.fromEntries(reg.execution_assumptions.cost_bps.map(c=>[String(c),x.gross_pct-c/100]));closed++;
   }
  }
 }
 const prior=m.last_signal_bar_t;m.last_processed_t=last;
 let new_signals=0;
 if(last>prior&&now-(last+BAR)>=0&&now-(last+BAR)<BAR){
  const indication=signal(pair.strategy,b.slice(-900));
  if(indication?.side==='LONG'||indication?.side==='SHORT'){
   for(const v of variants(reg)){
    const busy=m.observations.some(x=>x.variant===v.id&&['PENDING','OPEN'].includes(x.status));
    if(busy)continue;
    const entry_t=(Math.floor(now/BAR)+1)*BAR;
    m.observations.push({id:[coin,pair.strategy,v.id,last].join('|'),coin,strategy:pair.strategy,variant:v.id,
      signal_bar_t:last,observed_at_utc:iso(now),entry_t,status:'PENDING',side:indication.side,
      stop_pct:v.stop_pct,target_pct:v.target_pct,hold_bars:v.hold_bars,model:'EXPERIMENTAL_DELAYED_PAPER_ONLY'});new_signals++;
   }
  }
 }
 m.last_signal_bar_t=Math.max(prior,last);
 if(m.observations.length>MAX){
  let drop=m.observations.length-MAX;
  m.observations=m.observations.filter(x=>{if(drop&&['CLOSED','EXPIRED'].includes(x.status)){drop--;return false}return true});
 }
 j.updated_utc=iso(now);
 return {new_signals,closed,expired,initialized:false};
}
function summarize(j,reg){
 if(j?.schema!=='invo-v7.3-candidate-paper-1')throw Error('Unexpected experimental journal');
 const rows=reg.preregistered_pairs.flatMap(p=>(j.markets[p.coin]?.observations||[]).map(x=>({...x})));
 return {schema:'invo-v7.3-candidate-paper-summary-1',updated_utc:j.updated_utc,registered_utc:j.registered_utc,
  total_captured:rows.length,closed:rows.filter(x=>x.status==='CLOSED').length,
  by_candidate:Object.fromEntries(variants(reg).map(v=>[v.id,{closed:rows.filter(x=>x.variant===v.id&&x.status==='CLOSED').length}])),
  warning:'Independent separate capture going forward; correlated simultaneous paper trades are not portfolio returns, exchange fills, or independent profitability proof.'};
}
module.exports={init,update,evaluate,summarize,variants};
