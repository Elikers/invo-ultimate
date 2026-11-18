'use strict';
/* MAHORAGA v10 research-only validator: no network, credentials, orders or model learning.
 * The JSON schema is the wire contract; this is the additional semantic/time-series gate.
 */
const crypto=require('node:crypto');
const KINDS=new Set(['BOOK_SNAPSHOT','PUBLIC_TRADE','DERIVATIVES_CONTEXT','ENGINE_DECISION','OUTCOME_LABEL','COST_ASSUMPTION','CAPTURE_HEALTH']);
const VENUES=new Set(['hyperliquid','binance_usdm','invo_internal']);
const LATENCY_LIMIT_MS=Object.freeze({BOOK_SNAPSHOT:3000,PUBLIC_TRADE:5000,DERIVATIVES_CONTEXT:60000,
 ENGINE_DECISION:300000,OUTCOME_LABEL:300000,COST_ASSUMPTION:86400000,CAPTURE_HEALTH:300000});
const asInt=x=>Number.isSafeInteger(x)&&x>0;
function stableHash(raw){return crypto.createHash('sha256').update(typeof raw==='string'?raw:JSON.stringify(raw)).digest('hex');}
function envelope({kind,market,source,payload,sourceEventMs,receivedWallMs,receivedMonotonicMs,raw,rawRef,
 collectorRunId,messageId,reconnectEpoch=0,snapshot=false,sequence=null,sourceDocumentUrl,adapterVersion='v10.0'}) {
 if(!KINDS.has(kind)||!VENUES.has(source?.venue)||!asInt(sourceEventMs)||!asInt(receivedWallMs)||!
 Number.isFinite(receivedMonotonicMs)||receivedMonotonicMs<0||typeof sourceDocumentUrl!=='string')throw Error('Invalid input provenance');
 if(typeof rawRef!=='string'||rawRef.length<4||typeof collectorRunId!=='string'||collectorRunId.length<4||
 typeof messageId!=='string'||messageId.length<2||typeof market!=='string'||!payload||typeof payload!=='object')
 throw Error('Incomplete raw evidence linkage');
 const latency=receivedWallMs-sourceEventMs;
 const feedLatency=Math.max(0,latency),clockFuture=latency< -2000,stale=latency>LATENCY_LIMIT_MS[kind];
 const plausible=kind==='ENGINE_DECISION'||kind==='OUTCOME_LABEL'||kind==='COST_ASSUMPTION'||kind==='CAPTURE_HEALTH'?
 source.venue==='invo_internal':source.venue!=='invo_internal';
 if(!plausible)throw Error('Feed provenance does not match event kind');
 const valid=!clockFuture&&!stale;
 return {schema:'invo-v10-data-event-1',kind,market,
  source:{venue:source.venue,feed:source.feed,venue_symbol:source.venue_symbol,
    instrument_type:source.instrument_type,adapter_version:adapterVersion,collector_run_id:collectorRunId,
    raw_sha256:stableHash(raw),raw_ref:rawRef,source_document_url:sourceDocumentUrl,
    source_message_id:messageId},
  timestamps:{source_event_ms:sourceEventMs,received_wall_ms:receivedWallMs,received_monotonic_ms:receivedMonotonicMs,
    available_to_model_ms:receivedWallMs},
  payload,quality:{snapshot:!!snapshot,reconnect_epoch:reconnectEpoch,sequence,
    market_data_gap:false,feed_latency_ms:feedLatency,valid},
  use:{research_only:true,training_eligible:false,live_orders_allowed:false,
    reason:!valid?(clockFuture?'CLOCK_SKEW_FUTURE_EVENT':'STALE_RECEIPT'):'AWAITING_STREAM_AND_LABEL_REVIEW'}};
}
function validateSequence(state,event){
 if(event?.schema!=='invo-v10-data-event-1'||!KINDS.has(event.kind)||
 !asInt(event.timestamps?.source_event_ms)||!asInt(event.timestamps?.received_wall_ms)||
 !asInt(event.timestamps?.available_to_model_ms)||
 event.timestamps.available_to_model_ms<event.timestamps.received_wall_ms||
 event.use?.live_orders_allowed!==false||event.use?.research_only!==true||
 event.use?.training_eligible!==false)throw Error('Invalid or promoted evidence envelope');
 const k=[event.source.venue,event.source.feed,event.market].join('|');
 const old=state[k]||{epoch:-1,ready:false,lastMonotonic:-1,seenIds:[],lastSequence:null,lastSourceMs:0};
 if(!Number.isSafeInteger(event.quality.reconnect_epoch)||event.quality.reconnect_epoch<old.epoch)
 throw Error('Invalid/reversed reconnect epoch');
 const epochChanged=event.quality.reconnect_epoch>old.epoch;
 const next=epochChanged?{epoch:event.quality.reconnect_epoch,ready:false,lastMonotonic:-1,seenIds:[],lastSequence:null,lastSourceMs:0}:structuredClone(old);
 if(!Number.isFinite(event.timestamps.received_monotonic_ms)||event.timestamps.received_monotonic_ms<next.lastMonotonic)
 throw Error('Out-of-order monotonic receipt');
 if(next.seenIds.includes(event.source.source_message_id))return {status:'DUPLICATE_DROPPED',event:null,state};
 if(event.timestamps.source_event_ms<next.lastSourceMs)return {status:'LATE_EVENT_QUARANTINED',event:null,state};
 if(event.kind==='BOOK_SNAPSHOT'&&epochChanged&&!event.quality.snapshot)
 throw Error('Reconnected order book must begin with snapshot');
 if(event.quality.snapshot)next.ready=true;
 if(event.kind==='BOOK_SNAPSHOT'&&!next.ready){
  event.quality.market_data_gap=true;event.quality.valid=false;event.use.reason='NEED_SNAPSHOT_AFTER_RECONNECT';
 }
 if(event.quality.sequence!==null){
  if(!Number.isSafeInteger(event.quality.sequence)||event.quality.sequence<0)throw Error('Invalid sequence');
  if(next.lastSequence!==null&&event.quality.sequence!==next.lastSequence+1){
   event.quality.market_data_gap=true;event.quality.valid=false;event.use.reason='SEQUENCE_GAP_OR_REORDER';
   next.ready=false;
  }
  next.lastSequence=event.quality.sequence;
 }
 if(event.quality.market_data_gap)event.use.reason='UNTRUSTED_CAPTURE_GAP';
 next.lastMonotonic=event.timestamps.received_monotonic_ms;
 next.lastSourceMs=event.timestamps.source_event_ms;
 next.seenIds.push(event.source.source_message_id);
 if(next.seenIds.length>500)next.seenIds.shift();
 state[k]=next;
 return {status:event.quality.valid?'RESEARCH_ACCEPTED_NOT_TRAINING_APPROVED':'QUARANTINED',event,state};
}
function modelEligible(e,review){
 if(e?.schema!=='invo-v10-data-event-1'||e.use.training_eligible||!e.quality.valid||
 e.quality.market_data_gap||!review?.raw_payload_hash_verified||!review?.timestamp_audited||
 !review?.source_schema_checked||!review?.split_locked||!Number.isSafeInteger(review.cutoff_ms)||
 e.timestamps.available_to_model_ms>review.cutoff_ms)return false;
 // A prospective validation/test segment must NEVER become training data.
 return review.purpose==='TRAIN'&&review.segmentation==='REGISTERED_TRAIN_ONLY';
}
module.exports={envelope,validateSequence,modelEligible,stableHash};
