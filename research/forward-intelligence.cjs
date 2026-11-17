/* INVO v6.8 — Forward evidence and historic benchmark, diagnostic only.
 * Never uses historical observations as forward fills. No trade or signal changes.
 */
'use strict';
const COINS=['BTC','ETH','SOL','JUP'];
const IDS=['fusion','sweep','auction','pullback','volbreak','mean','strict'];
const COSTS=[8,16],MIN_GROUP=30,MIN_TOTAL=100;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const avg=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
function wilson(w,n,z=1.96){
 if(!Number.isInteger(w)||!Number.isInteger(n)||w<0||w>n||n<0)throw Error('Invalid win counts');
 if(n===0)return null;
 const p=w/n,den=1+z*z/n,mid=(p+z*z/(2*n))/den;
 const half=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/den;
 return {lower:Math.max(0,(mid-half)),upper:Math.min(1,(mid+half))};
}
function historical(report,coin,id,cost){
 const m=report?.markets?.[coin];
 if(m?.status!=='ANALYZED')return null;
 const row=(m.results||[]).find(r=>r.strategy===id&&r.cost_bps_round_trip===cost);
 const hold=row?.folds?.[2];
 return hold?{count:hold.count,expectancy_pct:finite(hold.expectancyPct)?hold.expectancyPct:null,profit_factor:hold.profitFactor??null,
  start_utc:hold.start_utc,end_utc:hold.end_utc,
  scope:'RETROSPECTIVE_LAST_25PCT_SAME_14_DAY_WINDOW'}:null;
}
function summarize(rows,cost){
 const returns=rows.map(x=>x.net_pct?.[String(cost)]).filter(finite);
 if(returns.length!==rows.length)throw Error('Missing verified paper cost scenario: '+cost);
 const wins=returns.filter(x=>x>0).length,losses=returns.filter(x=>x<0).length,net=avg(returns);
 const winValues=returns.filter(x=>x>0),lossValues=returns.filter(x=>x<0);
 const grossWins=winValues.reduce((a,b)=>a+b,0),grossLosses=-lossValues.reduce((a,b)=>a+b,0);
 return {count:rows.length,wins,losses,flat:rows.length-wins-losses,
  net_expectancy_pct:net,win_rate_pct:rows.length?100*wins/rows.length:null,
  win_rate_wilson_95pct:wilson(wins,rows.length),
  profit_factor:grossLosses?grossWins/grossLosses:null};
}
function build(journal,history,now=new Date().toISOString()){
 if(journal?.schema!=='invo-v6.3-forward-1')throw Error('Unrecognized forward journal');
 if(history?.schema!=='invo-v6.2-research-1')throw Error('Unrecognized historical report');
 const markets={},aggregate={closed:0,open:0,pending:0,expired:0,unresolved:0},seen=new Set();
 for(const coin of COINS){
  const obs=journal.markets?.[coin]?.observations||[];
  for(const x of obs){
   if(typeof x.id!=='string'||!x.id.startsWith(coin+'|')||!IDS.includes(x.strategy)||!['CLOSED','OPEN','PENDING','EXPIRED','UNRESOLVED_GAP'].includes(x.status))throw Error('Invalid paper entry '+coin);
   if(seen.has(x.id))throw Error('Duplicate forward paper signal ID '+x.id);
   seen.add(x.id);
  }
  const groups={};
  for(const id of IDS){
   const s=obs.filter(x=>x.strategy===id);
   const closed=s.filter(x=>x.status==='CLOSED');
   const counts={closed:closed.length,open:s.filter(x=>x.status==='OPEN').length,pending:s.filter(x=>x.status==='PENDING').length,
    expired:s.filter(x=>x.status==='EXPIRED').length,unresolved:s.filter(x=>x.status==='UNRESOLVED_GAP').length};
   for(const [k,v]of Object.entries(counts))aggregate[k]+=v;
   const costs={};
   for(const cost of COSTS){
    const forward=summarize(closed,cost),reference=historical(history,coin,id,cost);
    costs[String(cost)]={forward,reference,
      difference_pct:forward.net_expectancy_pct!==null&&reference?.expectancy_pct!==null?forward.net_expectancy_pct-reference.expectancy_pct:null,
      assessment:closed.length<MIN_GROUP?'INSUFFICIENT_FORWARD_GROUP_SAMPLE':
       reference?.count<20?'INSUFFICIENT_HISTORICAL_REFERENCE':
       'DESCRIPTIVE_COMPARISON_ONLY',
      interpretation:'Exploratory; historical selection and clustered paper trades can invalidate naive confidence assumptions.'};
   }
   groups[id]={...counts,costs};
  }
  markets[coin]={status:journal.markets?.[coin]?'OBSERVED':'NOT_INITIALIZED',groups};
 }
 return {schema:'invo-v6.8-forward-intelligence-1',created_utc:now,forward_started_utc:journal.started_utc,
  forward_updated_utc:journal.updated_utc,historical_report_utc:history.created_utc,
  required_samples:{min_closed_per_strategy_market:MIN_GROUP,min_closed_total:MIN_TOTAL},
  aggregate,overall_assessment:aggregate.closed<MIN_TOTAL?'FORWARD_SAMPLE_INSUFFICIENT':'EXPLORATORY_PAPER_ONLY',
  markets,warnings:[
   'Actual captured forward paper signals only; no broker/exchange fills or live returns.',
   'Wilson intervals describe win frequency only, not a confidence interval for profitability, and independence is unverified.',
   'Historical last-quarter values are retrospective and may overlap in calendar time; NOT independent out-of-sample performance.',
   'These comparisons do not approve strategies, optimize entry/exit conditions, or authorize orders.'
  ]};
}
module.exports={wilson,summarize,historical,build,COINS,IDS,MIN_GROUP,MIN_TOTAL};
