/* INVO v6.7 — append-only paper event archive, once-per-day research snapshots, and watchdog. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),FI=require('./forward-intelligence.cjs'),COV=require('./collector-coverage.cjs');
const SCHEMA='invo-v6.7-operations-1';
const COINS=['BTC','ETH','SOL','JUP'];
const IDS=['fusion','sweep','auction','pullback','volbreak','mean','strict'];
function iso(s){const t=Date.parse(s||'');return Number.isFinite(t)?new Date(t).toISOString():null}
function positiveInt(x){return Number.isInteger(x)&&x>=0}
function status(health,forward,now=Date.now()){
 const observed=iso(health?.observed_utc);
 const age=observed?Math.max(0,Math.round((now-Date.parse(observed))/60000)):null;
 const flags=[];
 if(!observed)flags.push('COLLECTOR_MISSING');
 else if(age>45)flags.push('COLLECTOR_STALE');
 if(health?.action_event!=='schedule')flags.push('SCHEDULE_NOT_VERIFIED_BY_LAST_CHECK');
 if(health&&health.processed_markets!==COINS.length)flags.push('PARTIAL_MARKET_COVERAGE');
 for(const coin of COINS){
  if(health?.results?.[coin]?.status!=='OK')flags.push('MARKET_NOT_OK_'+coin);
 }
 const closed=COINS.reduce((s,c)=>s+(forward?.markets?.[c]?.closed||0),0);
 if(closed<60)flags.push('FORWARD_SAMPLE_INSUFFICIENT');
 const watch={
  schema:SCHEMA,checked_utc:new Date(now).toISOString(),collector_utc:observed,collector_age_minutes:age,
  collector_trigger:health?.action_event||'UNKNOWN',collector_run_id:health?.action_run_id||null,
  last_run_scheduled:health?.action_event==='schedule',forward_closed_paper:closed,
  processed_markets:health?.processed_markets??null,flags,
  interpretation:'Latest heartbeat event does not prove repeated scheduled reliability; paper observations are not exchange fills.'
 };
 return watch;
}
function eventRows(journal){
 if(!journal||journal.schema!=='invo-v6.3-forward-1')throw Error('Unrecognized forward journal');
 const rows=[];
 for(const [coin,m]of Object.entries(journal.markets||{})){
  if(!COINS.includes(coin))throw Error('Unrecognized market');
  for(const x of m.observations||[]){
   if(typeof x.id!=='string'||!x.id.startsWith(coin+'|')||!IDS.includes(x.strategy)||!['PENDING','OPEN','CLOSED','EXPIRED','UNRESOLVED_GAP'].includes(x.status))throw Error('Invalid observed paper trade');
   const key=[x.id,x.status,x.entry??'',x.exit??'',x.reason??''].join('|');
   rows.push({key,id:x.id,coin,strategy:x.strategy,status:x.status,side:x.side,
    observed_at_utc:x.observed_at_utc||null,signal_bar_t:x.signal_bar_t,
    entry_t:x.entry_t,entry:x.entry??null,exit_t:x.exit_t??null,exit:x.exit??null,
    reason:x.reason||null,net_pct:x.net_pct||null,model:'FORWARD_CAPTURED_DELAYED_PAPER_ONLY'});
  }
 }
 return rows;
}
function appendEvents(old,journal){
 const existing=new Set();const records=[];
 for(const line of String(old||'').split('\n').filter(Boolean)){
  const x=JSON.parse(line);if(!x.key)throw Error('Corrupt archived line without key');existing.add(x.key);records.push(x);
 }
 let added=0;
 for(const row of eventRows(journal))if(!existing.has(row.key)){existing.add(row.key);records.push(row);added++;}
 return {content:records.map(x=>JSON.stringify(x)).join('\n')+(records.length?'\n':''),added,total:records.length};
}
function dailySummary(research,diagnosis,intelligence,forward){
 if(research?.schema!=='invo-v6.2-research-1')throw Error('No valid historical research');
 const byMarket={};
 for(const [coin,m] of Object.entries(research.markets||{})){
  if(m.status!=='ANALYZED'){byMarket[coin]={status:m.status};continue;}
  byMarket[coin]={status:'ANALYZED',trades_by_strategy:Object.fromEntries((m.results||[]).filter(x=>x.cost_bps_round_trip===8).map(x=>[x.strategy,{count:x.trade_count,holdout:x.folds?.[2],screen:x.screen}]))};
 }
 return {schema:'invo-v6.7-daily-snapshot-1',created_utc:research.created_utc,
  historical_window_start_utc:research.window_start_utc,historical_window_end_utc:research.window_end_utc,
  market_status:byMarket,loss_diagnosis_utc:diagnosis?.created_utc||null,regimes_utc:intelligence?.created_utc||null,
  forward_summary_utc:forward?.created_utc||null,
  warning:'Retrospective historical screens only; no independent proof of profitability.'};
}
function save(root,opts={}){
 const read=p=>{const file=path.join(root,'research',p);return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null};
 const health=read('collector-health.json'),forward=read('forward-summary.json');
 const journal=read('forward-journal.json');
 const archive=path.join(root,'research','archive');
 fs.mkdirSync(archive,{recursive:true});
 const eventsPath=path.join(archive,'forward-events.jsonl');
 const previous=fs.existsSync(eventsPath)?fs.readFileSync(eventsPath,'utf8'):'';
 const events=appendEvents(previous,journal);
 if(events.added)fs.writeFileSync(eventsPath,events.content);
 const historical=read('latest.json');
 const intelligence=FI.build(journal,historical);
 fs.writeFileSync(path.join(root,'research','forward-intelligence.json'),JSON.stringify(intelligence,null,2)+'\n');
 const watch=status(health,forward);
 const coverage=COV.assess(health);
 fs.writeFileSync(path.join(root,'research','collector-coverage.json'),JSON.stringify(coverage,null,2)+'\n');
 fs.writeFileSync(path.join(root,'research','operations-health.json'),JSON.stringify(watch,null,2)+'\n');
 let snapshot=null;
 if(opts.fullResearch){
  const research=read('latest.json'),d=read('loss-diagnosis.json'),m=read('market-intelligence.json');
  const daily=dailySummary(research,d,m,forward);
  const key=daily.created_utc.slice(0,10);
  const file=path.join(archive,'daily',key+'.json');
  fs.mkdirSync(path.dirname(file),{recursive:true});
  // A dated snapshot never overwrites earlier evidence. Artifacts keep full run outputs.
  if(!fs.existsSync(file)){fs.writeFileSync(file,JSON.stringify(daily,null,2)+'\n');snapshot=key;}
 }
 return {watch,added_events:events.added,archived_events:events.total,new_daily_snapshot:snapshot};
}
if(require.main===module){
 const root=path.resolve(__dirname,'..'),full=process.argv.includes('--full');
 try{const result=save(root,{fullResearch:full});console.log('INVO v6.7 archive and watchdog:',JSON.stringify(result));}
 catch(e){console.error('INVO v6.7 archive integrity failure:',e.message);process.exitCode=1;}
}
module.exports={status,eventRows,appendEvents,dailySummary,save};
