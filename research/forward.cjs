/* INVO v6.3 — persistent forward-only, latency-aware paper observation journal.
 * A signal is captured only on the last completed 5m candle at an actual run.
 * The paper entry is no earlier than the next unstarted 5m candle open.
 * Never retrospectively reconstruct missed signals or claim exchange fills.
 */
'use strict';
const C=require('../v61-core.js');
const BAR=300000,IDS=['fusion','sweep','auction','pullback','volbreak','mean','strict'];
const COSTS=[8,16],STOP=1,TARGET=1.5,HOLD=12,MAX_ROWS=1600;
const iso=t=>new Date(t).toISOString();
function init(now){return {schema:'invo-v6.3-forward-1',started_utc:iso(now),updated_utc:iso(now),settings:{stop_pct:STOP,target_pct:TARGET,hold_bars:HOLD,round_trip_cost_bps:COSTS,signal:'last completed 5m candle only',entry:'first unopened five-minute bar after observed run',costs:'fixed illustrative, not actual market fills'},markets:{}};}
function freshMarket(t){return {last_processed_t:null,last_signal_bar_t:null,observations:[],gaps:0,missed_runs:0,unavailable_runs:0};}
function evaluate(trade,bar){
 const dir=trade.side==='LONG'?1:-1,stop=trade.entry*(1-dir*STOP/100),target=trade.entry*(1+dir*TARGET/100);
 const stopGap=dir===1?bar.o<=stop:bar.o>=stop;
 const hitStop=dir===1?bar.l<=stop:bar.h>=stop;
 const hitTarget=dir===1?bar.h>=target:bar.l<=target;
 if(stopGap)return {exit:bar.o,reason:'STOP_GAP'};
 if(hitStop)return {exit:stop,reason:hitTarget?'STOP_BOTH':'STOP'};
 if(hitTarget)return {exit:target,reason:'TARGET'};
 if(bar.t>=trade.entry_t+BAR*(HOLD-1))return {exit:bar.c,reason:'TIME'};
 return null;
}
function summary(m){
 const closed=m.observations.filter(x=>x.status==='CLOSED');
 const cohorts={};
 for(const cost of COSTS)cohorts[cost]={};
 for(const id of IDS){
  const rows=closed.filter(x=>x.strategy===id);
  for(const cost of COSTS){
   cohorts[cost][id]={...C.summary(rows.map(x=>({netPct:x.net_pct[String(cost)]}))),evidence:'FORWARD_CAPTURED_PAPER_ONLY'};
  }
 }
 return {closed:closed.length,pending:m.observations.filter(x=>x.status==='PENDING').length,open:m.observations.filter(x=>x.status==='OPEN').length,unresolved:m.observations.filter(x=>x.status==='UNRESOLVED_GAP').length,expired:m.observations.filter(x=>x.status==='EXPIRED').length,by_cost_bps:cohorts};
}
function update(state,coin,bars,signal,now){
 if(!C.valid(bars))throw Error('Invalid or discontinuous 5m history');
 if(!state||state.schema!=='invo-v6.3-forward-1')throw Error('Unknown forward journal');
 if(!Number.isFinite(now)||now<bars.at(-1).t+BAR)throw Error('Observation time predates last candle completion');
 const m=state.markets[coin]||freshMarket();
 const prev=m.last_processed_t,first=bars[0].t,last=bars.at(-1).t;
 if(prev===null){
  // Baseline initialization: deliberately DO NOT generate signals on historical bars.
  m.last_processed_t=last;
  m.last_signal_bar_t=last;
  state.markets[coin]=m;state.updated_utc=iso(now);
  return {initialized:true,new_signals:0,closed:0,missed:0};
 }
 if(prev>last)throw Error('Market history went backwards; no journal mutation');
 const expected=prev+BAR;
 if(expected<first){
  m.gaps++;
  for(const x of m.observations)if(x.status==='PENDING'||x.status==='OPEN'){x.status='UNRESOLVED_GAP';x.reason='MISSING_COMPLETED_CANDLES';x.unresolved_at_utc=iso(now);}
  m.last_processed_t=last; m.last_signal_bar_t=last;
  state.markets[coin]=m;state.updated_utc=iso(now);
  return {initialized:false,new_signals:0,closed:0,missed:0,gap:true};
 }
 let closed=0,expired=0;
 for(const b of bars){
  if(b.t<=prev)continue;
  for(const x of m.observations){
   if(x.status==='PENDING'&&b.t>=x.entry_t){
    if(b.t!==x.entry_t){x.status='EXPIRED';x.reason='MISSED_PLANNED_ENTRY';expired++;continue;}
    x.entry=b.o;x.status='OPEN';x.entered_at_utc=iso(b.t);
   }
   if(x.status!=='OPEN'||b.t<x.entry_t)continue;
   const hit=evaluate(x,b);
   if(hit){
    x.exit=hit.exit;x.exit_t=b.t+BAR;x.reason=hit.reason;x.status='CLOSED';
    x.gross_pct=(x.side==='LONG'?1:-1)*(x.exit-x.entry)/x.entry*100;
    x.net_pct=Object.fromEntries(COSTS.map(c=>[String(c),x.gross_pct-c/100]));
    closed++;
   }
  }
 }
 m.last_processed_t=last;
 // Only the freshest completed bar is eligible. Skipped runs are NOT replayed.
 const behind=now-(last+BAR);
 const missed=behind>=BAR?Math.floor(behind/BAR):0;
 m.missed_runs+=missed;
 let new_signals=0;
 if(behind>=0&&behind<BAR&&last>m.last_signal_bar_t){
  for(const id of IDS){
   if(m.observations.some(x=>x.strategy===id&&(x.status==='OPEN'||x.status==='PENDING')))continue;
   const s=signal(id,bars.slice(-900));
   if(s?.side!=='LONG'&&s?.side!=='SHORT')continue;
   // Runner cannot capture the just-opened candle's executable opening price in real time.
   // Always schedule an entry for the NEXT not-yet-opened candle.
   const entry_t=(Math.floor(now/BAR)+1)*BAR;
   m.observations.push({id:coin+'|'+id+'|'+last,strategy:id,side:s.side,signal_bar_t:last,observed_at_utc:iso(now),entry_t,status:'PENDING',model:'DELAYED_PAPER_ONLY'});
   new_signals++;
  }
 }
 m.last_signal_bar_t=Math.max(m.last_signal_bar_t??last,last);
 if(m.observations.length>MAX_ROWS){
  // Never erase unresolved/open entries; prune oldest settled observations.
  let excess=m.observations.length-MAX_ROWS;
  m.observations=m.observations.filter(x=>{if(excess>0&&(x.status==='CLOSED'||x.status==='EXPIRED')){excess--;return false;}return true;});
 }
 state.markets[coin]=m;state.updated_utc=iso(now);
 return {initialized:false,new_signals,closed,expired,missed};
}
function overview(state){
 const stats={};
 for(const [coin,m]of Object.entries(state.markets||{}))stats[coin]={last_processed_utc:m.last_processed_t===null?null:iso(m.last_processed_t+BAR),gaps:m.gaps,missed_runs:m.missed_runs,unavailable_runs:m.unavailable_runs,...summary(m)};
 return {schema:'invo-v6.3-forward-summary-1',created_utc:state.updated_utc,started_utc:state.started_utc,warning:'Forward-captured delayed PAPER simulation only; zero real fills or verified tradable returns. No retroactive signals.',markets:stats};
}
module.exports={init,update,overview,evaluate,summary,BAR,IDS,COSTS};
