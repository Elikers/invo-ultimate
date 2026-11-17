/* INVO recovery checks: validate persisted paper event archive, not profitability. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
function audit(text){
 const rows=String(text||'').split('\n').filter(Boolean).map(x=>JSON.parse(x));
 const keys=new Set(),states=new Map();
 const ranks={PENDING:0,OPEN:1,CLOSED:2,EXPIRED:2,UNRESOLVED_GAP:2};
 for(const row of rows){
  if(!row.key||!row.id||!Object.hasOwn(ranks,row.status)||!row.key.startsWith(row.id+'|')||row.model!=='FORWARD_CAPTURED_DELAYED_PAPER_ONLY')
   throw Error('Invalid archived forward paper event');
  if(keys.has(row.key))throw Error('Duplicated paper event key');
  keys.add(row.key);
  const old=states.get(row.id);
  if(old!==undefined && ranks[row.status]<old)throw Error('Backwards archived paper state for '+row.id);
  states.set(row.id,ranks[row.status]);
 }
 return {archived_transition_records:rows.length,unique_signal_ids:states.size,duplicates:0,warning:'Archived paper journal transitions are not exchange fills.'};
}
function main(root){
 const file=path.join(root,'research/archive/forward-events.jsonl');
 const result=audit(fs.existsSync(file)?fs.readFileSync(file,'utf8'):'');
 const daily=path.join(root,'research/archive/daily');
 let snapshots=0;
 if(fs.existsSync(daily)){
  for(const name of fs.readdirSync(daily)){
   if(!/^\d{4}-\d{2}-\d{2}\.json$/.test(name))throw Error('Unexpected daily archive filename');
   const j=JSON.parse(fs.readFileSync(path.join(daily,name),'utf8'));
   if(j.schema!=='invo-v6.7-daily-snapshot-1'||j.created_utc?.slice(0,10)!==name.slice(0,10))throw Error('Invalid immutable daily snapshot '+name);
   snapshots++;
  }
 }
 return {...result,daily_snapshots:snapshots};
}
if(require.main===module){
 try{console.log('Research archive audit passed',JSON.stringify(main(path.resolve(__dirname,'..'))))}
 catch(e){console.error('Archive audit FAILED',e.message);process.exitCode=1;}
}
module.exports={audit,main};
