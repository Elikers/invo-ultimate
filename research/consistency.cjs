/* INVO v6.9 Phase 3: read-only prospective paper consistency diagnostics.
 * Split by signal chronology, not by retrospective optimization. No trading decisions.
 */
'use strict';
const COINS=['BTC','ETH','SOL','JUP'],IDS=['fusion','sweep','auction','pullback','volbreak','mean','strict'];
const COSTS=[8,16],MIN_HALF=10;
const avg=arr=>arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:null;
function compare(rows,cost){
 const complete=rows.filter(x=>x.status==='CLOSED').sort((a,b)=>(a.signal_bar_t||0)-(b.signal_bar_t||0));
 const n=complete.length,half=Math.floor(n/2),left=complete.slice(0,half),right=complete.slice(half);
 const values=xs=>xs.map(x=>x.net_pct?.[String(cost)]);
 const all=values(complete);
 if(all.some(v=>typeof v!=='number'||!Number.isFinite(v)))throw Error('Invalid paper net return');
 const first=avg(values(left)),second=avg(values(right));
 return {closed:n,first_half_count:left.length,last_half_count:right.length,
  first_half_expectancy_pct:first,last_half_expectancy_pct:second,
  last_minus_first_pct_points:first!==null&&second!==null?second-first:null,
  assessment:left.length<MIN_HALF||right.length<MIN_HALF?'INSUFFICIENT_CHRONOLOGICAL_SAMPLE':
   'DESCRIPTIVE_CHANGE_ONLY',warning:'Signal times can overlap across markets; chronology is descriptive, not an independent regime test or a signal filter.'};
}
function build(journal,now=new Date().toISOString()){
 if(journal?.schema!=='invo-v6.3-forward-1')throw Error('Unexpected forward journal schema');
 const markets={};
 for(const coin of COINS){
  const rows=journal.markets?.[coin]?.observations||[],strategies={};
  for(const id of IDS){
   const group=rows.filter(x=>x.strategy===id);
   strategies[id]={closed:group.filter(x=>x.status==='CLOSED').length,by_cost_bps:Object.fromEntries(COSTS.map(c=>[c,compare(group,c)]))};
  }
  markets[coin]={strategies};
 }
 return {schema:'invo-v6.9-consistency-1',created_utc:now,forward_updated_utc:journal.updated_utc,
  minimum_half_sample:MIN_HALF,markets,
  warning:'Only forward-captured delayed paper trades; no retroactive entries or proof of profitable execution. Comparisons are exploratory and correlated, not trading recommendations.'};
}
module.exports={compare,build,MIN_HALF};
