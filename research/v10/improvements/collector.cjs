'use strict';
// MAHORAGA v10.1: bounded, restart-auditable public data ingest. No WebSocket daemon, orders or credentials.
// Raw records are stored alongside normalized events; training is ALWAYS disabled until separate review.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const A=require('../data/feed-adapters.cjs'),P=require('../data/provenance.cjs');
const digest=raw=>crypto.createHash('sha256').update(raw).digest('hex');
function safeJson(line){try{return JSON.parse(line);}catch{throw Error('Corrupt capture journal');}}
class Collector {
 constructor(dir,{maxEvents=5000,maxAgeMs=180000}={}){
  if(typeof dir!=='string'||maxEvents<1||maxEvents>100000||maxAgeMs<1000)throw Error('Unsafe collector configuration');
  this.dir=dir;this.maxEvents=maxEvents;this.maxAgeMs=maxAgeMs;this.state={};
  this.health={schema:'mahoraga-v10-collector-health-1',research_only:true,orders_allowed:false,
   observed:0,accepted:0,rejected:0,duplicates:0,gaps:0,reconnects:0,parse_errors:0,
   event_time_unknown:0,started_ms:Date.now(),last_accepted_ms:null,training_eligible:false};
  fs.mkdirSync(dir,{recursive:true});
  this.file=path.join(dir,'public-events.jsonl');
  if(fs.existsSync(this.file)){
   const text=fs.readFileSync(this.file,'utf8');
   if(text&&!text.endsWith('\n'))throw Error('Truncated event journal; quarantine before restart');
   this.rows=text.trim()?text.trim().split('\n').map(safeJson):[];
   for(const record of this.rows){
    if(record.record_sha256!==digest(record.raw)||record.event.source.raw_sha256!==record.record_sha256)
     throw Error('Raw archive checksum mismatch');
    if(record.event.use.training_eligible!==false||record.event.use.live_orders_allowed!==false)
     throw Error('Unsafe journal privilege');
    const k=record.event.source.venue+'|'+record.event.source.feed+'|'+record.event.market;
    if(!this.state[k])this.state[k]={seen:new Set(),lastEventMs:0};
    this.state[k].seen.add(record.event.source.source_message_id);
    this.state[k].lastEventMs=Math.max(this.state[k].lastEventMs,record.event.timestamps.source_event_ms);
   }
  }else this.rows=[];
  if(this.rows.length>=this.maxEvents)throw Error('Bounded capture at capacity');
 }
 ingest(raw,{receivedWallMs=Date.now(),receivedMonotonicMs=0}={}){
  this.health.observed++;
  if(this.rows.length>=this.maxEvents){this.health.rejected++;return 'CAPACITY_STOP';}
  if(typeof raw!=='string'||raw.length>128000){this.health.rejected++;return 'RAW_SIZE_INVALID';}
  let frames;
  try{
   const msg=JSON.parse(raw);
   if(msg.channel==='l2Book')frames=[A.book(msg)];
   else if(msg.channel==='trades')frames=A.trades(msg);
   else if(msg.channel==='activeAssetCtx'){
    // The public context feed does not consistently provide exchange event time;
    // prohibit invention of timestamps and hold it in a receipt-only quarantine lane.
    A.context(msg,receivedWallMs);this.health.event_time_unknown++;
    return 'DERIVATIVES_RECEIPT_ONLY_QUARANTINED';
   } else return 'IGNORED_OTHER_CHANNEL';
  }catch{this.health.parse_errors++;this.health.rejected++;return 'BAD_FRAME';}
  let accepted=0;
  for(const f of frames){
   if(f.coin!=='BTC'&&f.coin!=='ETH'&&f.coin!=='SOL'){this.health.rejected++;continue;}
   const feed=f.kind==='BOOK_SNAPSHOT'?'l2Book':'trades';
   const key='hyperliquid|'+feed+'|'+f.coin;
   const id=f.kind==='PUBLIC_TRADE'?f.sourceMessageId:
      f.coin+'-'+f.sourceEventMs+'-'+digest(raw).slice(0,12);
   if(!this.state[key])this.state[key]={seen:new Set(),lastEventMs:0};
   const st=this.state[key];
   if(st.seen.has(id)){this.health.duplicates++;continue;}
   if(f.sourceEventMs<st.lastEventMs){this.health.gaps++;this.health.rejected++;continue;}
   const event=P.envelope({kind:f.kind,market:f.coin,
     source:{venue:'hyperliquid',feed,venue_symbol:f.coin,instrument_type:'PERPETUAL'},
     payload:f.payload,sourceEventMs:f.sourceEventMs,receivedWallMs,
     receivedMonotonicMs,raw,rawRef:'local-research/public-events.jsonl',
     collectorRunId:'v10-bounded-public-reader',messageId:id,
     snapshot:f.kind==='BOOK_SNAPSHOT',sourceDocumentUrl:
     'https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions'});
   if(!event.quality.valid){this.health.rejected++;continue;}
   // fsync + read-only provenance are necessary but not sufficient for a production collector.
   const record={event,raw,record_sha256:digest(raw)};
   const fd=fs.openSync(this.file,'a',0o600);
   try{fs.writeSync(fd,JSON.stringify(record)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
   this.rows.push(record);st.seen.add(id);st.lastEventMs=f.sourceEventMs;
   this.health.accepted++;this.health.last_accepted_ms=receivedWallMs;accepted++;
  }
  return accepted?'ACCEPTED_RESEARCH_ONLY':'QUARANTINED_OR_DUPLICATE';
 }
 disconnect(){this.health.reconnects++;this.health.gaps++;}
 summary(nowMs=Date.now()){
  return {...this.health,stored_events:this.rows.length,
   stale:!this.health.last_accepted_ms||nowMs-this.health.last_accepted_ms>this.maxAgeMs,
   stream_coverage_proven:false,model_training_approved:false,
   persistence_scope:'local filesystem only; no continuous deployment'};
 }
}
module.exports={Collector,digest};
