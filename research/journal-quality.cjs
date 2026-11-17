/* INVO v6.8.1 — strict read-only forward paper journal accounting audit.
 * No trading logic, market orders, simulations, or strategy tuning.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const BAR=300000,COINS=['BTC','ETH','SOL','JUP'];
const IDS=['fusion','sweep','auction','pullback','volbreak','mean','strict'];
const statuses=['PENDING','OPEN','CLOSED','EXPIRED','UNRESOLVED_GAP'];
function validEpoch(n){return Number.isSafeInteger(n)&&n>=0&&n%BAR===0}
function isoTime(x){const t=Date.parse(x||'');return Number.isFinite(t)?t:null}
function finite(n){return typeof n==='number'&&Number.isFinite(n)}
function audit(journal,now=Date.now()){
 if(journal?.schema!=='invo-v6.3-forward-1')throw Error('Unexpected journal schema');
 if(!finite(now))throw Error('Invalid audit clock');
 const signalIds=new Set();
 const result={schema:'invo-v6.8.1-journal-quality-1',checked_utc:new Date(now).toISOString(),
  signals:0,closed:0,pending:0,open:0,expired:0,unresolved:0,
  checked_cost_scenarios:[8,16],markets:{},status:'VALIDATED_PAPER_ACCOUNTING',
  warning:'Accounting checks validate internal simulated paper arithmetic, NOT market fills, historical edge or profitability.'};
 for(const coin of COINS){
  const m=journal.markets?.[coin],counts={signals:0,closed:0,pending:0,open:0,expired:0,unresolved:0};
  for(const x of m?.observations||[]){
   const label=coin+'/'+(x?.id||'unknown');
   function fail(msg){throw Error(label+': '+msg)}
   if(typeof x.id!=='string'||!x.id.startsWith(coin+'|')||!IDS.includes(x.strategy)||!statuses.includes(x.status)||!['LONG','SHORT'].includes(x.side))fail('bad identifying fields');
   if(x.id!==[coin,x.strategy,x.signal_bar_t].join('|'))fail('signal identity mismatch');
   if(signalIds.has(x.id))fail('duplicate signal ID');
   signalIds.add(x.id);
   if(!validEpoch(x.signal_bar_t)||!validEpoch(x.entry_t)||x.entry_t<x.signal_bar_t+2*BAR)fail('invalid delayed-entry chronology');
   const observed=isoTime(x.observed_at_utc);
   if(observed===null||observed<x.signal_bar_t+BAR||observed>now+60000)fail('invalid signal observation time');
   if(x.status==='CLOSED'){
    if(!finite(x.entry)||x.entry<=0||!finite(x.exit)||x.exit<=0)fail('invalid entry/exit prices');
    if(!validEpoch(x.exit_t)||x.exit_t<x.entry_t+BAR||x.exit_t>x.entry_t+12*BAR)fail('exit outside fixed 12-bar paper window');
    const gross=(x.side==='LONG'?1:-1)*(x.exit-x.entry)/x.entry*100;
    if(!finite(x.gross_pct)||Math.abs(gross-x.gross_pct)>1e-9)fail('gross P/L mismatch');
    for(const cost of [8,16]){
     const net=x.net_pct?.[String(cost)];
     if(!finite(net)||Math.abs(net-(gross-cost/100))>1e-9)fail('net '+cost+'bps accounting mismatch');
    }
    if(!['STOP_GAP','STOP_BOTH','STOP','TARGET','TIME'].includes(x.reason))fail('unexpected close reason');
    counts.closed++;result.closed++;
   }else{
    if(x.net_pct!==undefined||x.gross_pct!==undefined)fail('unfinished paper observation has settled return');
    const k={PENDING:'pending',OPEN:'open',EXPIRED:'expired',UNRESOLVED_GAP:'unresolved'}[x.status];
    counts[k]++;result[k]++;
   }
   counts.signals++;result.signals++;
  }
  result.markets[coin]=counts;
 }
 for(const coin of Object.keys(journal.markets||{}))if(!COINS.includes(coin))throw Error('Unknown journal market '+coin);
 return result;
}
function main(root){
 const file=path.join(root,'research/forward-journal.json');
 const report=audit(JSON.parse(fs.readFileSync(file,'utf8')));
 const target=path.join(root,'research/journal-quality.json');
 fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
 console.log('INVO v6.8.1 paper accounting quality gate passed',JSON.stringify({signals:report.signals,closed:report.closed}));
 return report;
}
if(require.main===module){try{main(path.resolve(__dirname,'..'))}catch(e){console.error('PAPER JOURNAL ACCOUNTING AUDIT FAILED:',e.message);process.exitCode=1}}
module.exports={audit,main};
