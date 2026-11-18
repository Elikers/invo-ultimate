'use strict';
// Research-only disk-backed ingest. Source frames are retained verbatim, rejected frames
// quarantined, and replay is verified after restart. No trading, no permanent daemon.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const A=require('../data/feed-adapters.cjs'),P=require('../data/provenance.cjs');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const append=(file,record)=>{const fd=fs.openSync(file,'a',0o600);try{fs.writeSync(fd,JSON.stringify(record)+'\n');fs.fsyncSync(fd)}finally{fs.closeSync(fd)}};
const read=file=>{if(!fs.existsSync(file))return [];
 const b=fs.readFileSync(file,'utf8');if(!b)return [];
 if(!b.endsWith('\n'))throw Error('Torn append: quarantine entire capture before recovery');
 return b.trimEnd().split('\n').map(x=>JSON.parse(x))};
function open(root,runId){
 if(!/^[a-z0-9_-]{5,80}$/i.test(runId))throw Error('Invalid run ID');
 fs.mkdirSync(root,{recursive:true});
 const files={raw:path.join(root,'raw.jsonl'),events:path.join(root,'events.jsonl'),health:path.join(root,'health.jsonl')};
 const raw=read(files.raw),events=read(files.events),health=read(files.health);
 if(raw.length!==health.length)throw Error('Raw/health mismatch; manual audit required');
 for(let i=0;i<raw.length;i++){
  if(sha(raw[i].bytes)!==raw[i].sha256||health[i].raw_sha256!==raw[i].sha256)
   throw Error('Raw evidence corrupted');
 }
 const state={},seen=new Set();
 for(const e of events){
  const rawRecord=raw.find(x=>x.sha256===e.source.raw_sha256);
  if(!rawRecord||e.use.training_eligible!==false||e.use.live_orders_allowed!==false)
   throw Error('Orphaned or promoted evidence');
  // Rebuild duplicate guard on all accepted events, preserving original receipt monotonic.
  const r=P.validateSequence(state,structuredClone(e));
  if(r.status!=='RESEARCH_ACCEPTED_NOT_TRAINING_APPROVED')throw Error('Non-replayable capture event');
  seen.add(e.source.source_message_id);
 }
 function ingest(bytes,receivedWallMs,receivedMonotonicMs,epoch=0){
  if(typeof bytes!=='string'||bytes.length>2e6||!Number.isSafeInteger(receivedWallMs)||
   !Number.isFinite(receivedMonotonicMs))throw Error('Invalid raw frame');
  const h=sha(bytes),seq=raw.length+1;
  const rr={seq,sha256:h,bytes,receivedWallMs,receivedMonotonicMs,epoch};
  append(files.raw,rr);raw.push(rr);
  let status='IGNORED_CONTROL',accepted=0;
  try{
   const msg=JSON.parse(bytes),parsed=msg.channel==='l2Book'?[A.book(msg)]:
    msg.channel==='trades'?A.trades(msg):[];
   for(const x of parsed){
    if(!['BTC','ETH','SOL'].includes(x.coin))throw Error('Wrong instrument');
    const id=x.kind==='PUBLIC_TRADE'?x.coin+'-trade-'+x.sourceMessageId:x.coin+'-book-'+x.sourceEventMs+'-'+h.slice(0,12);
    if(seen.has(id)){status='DUPLICATE_DROPPED_REPLAY';continue;}
    const e=P.envelope({kind:x.kind,market:x.coin,source:{venue:'hyperliquid',
     feed:x.kind==='PUBLIC_TRADE'?'trades':'l2Book',venue_symbol:x.coin,instrument_type:'PERPETUAL'},
     payload:x.payload,sourceEventMs:x.sourceEventMs,receivedWallMs,receivedMonotonicMs,
     raw:bytes,rawRef:files.raw+'#'+seq,collectorRunId:runId,messageId:id,
     reconnectEpoch:epoch,snapshot:x.kind==='BOOK_SNAPSHOT',
     sourceDocumentUrl:'https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions'});
    const r=P.validateSequence(state,e);
    status=r.status;
    if(r.status==='RESEARCH_ACCEPTED_NOT_TRAINING_APPROVED'){
     append(files.events,e);events.push(e);seen.add(id);accepted++;
    }
   }
  }catch(err){status='QUARANTINED_'+err.message.slice(0,100)}
  append(files.health,{seq,raw_sha256:h,status,accepted,receivedWallMs,epoch});
  health.push({seq,raw_sha256:h,status,accepted,receivedWallMs,epoch});
  return {status,accepted,training_eligible:false};
 }
 return {ingest,files,health:()=>({frames:raw.length,accepted:events.length,
  quarantined:health.filter(x=>x.status.startsWith('QUARANTINED')||x.status==='LATE_EVENT_QUARANTINED').length,
  duplicate_dropped:health.filter(x=>x.status.includes('DUPLICATE')).length,
  accepted_by_market:Object.fromEntries(['BTC','ETH','SOL'].map(m=>[m,events.filter(e=>e.market===m).length])),
  complete_feed_proven:false,live_trading:false})};
}
module.exports={open,read};
