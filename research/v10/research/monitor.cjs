'use strict';
// Run-health gate. States are explicit; missing data never means a healthy market.
const F=require('../forward/forward.cjs'),L=require('./ledger.cjs');
const CONFIG=Object.freeze({first_allowed_ms:F.START,expected_interval_ms:3600000,
 stale_after_ms:5400000,max_gaps_per_run:0,allow_live_orders:false,
 allow_auto_promotion:false});
function inspect(now,ledger,latestReceipt){
 if(!Number.isSafeInteger(now))throw Error('now must be epoch ms');
 const reasons=[];
 if(now<CONFIG.first_allowed_ms)reasons.push('REGISTRATION_NOT_ACTIVE');
 if(!ledger)reasons.push('NO_DURABLE_LEDGER');
 else{try{L.verify(ledger)}catch{reasons.push('LEDGER_INVALID')}}
 if(!latestReceipt)reasons.push('NO_RECEIPT');
 else{
  if(latestReceipt.schema!=='mahoraga-v103-capture-receipt-v1'||latestReceipt.live_orders!==false)
   reasons.push('INVALID_RECEIPT');
  if(!Number.isSafeInteger(latestReceipt.ended_at_ms)||
     latestReceipt.ended_at_ms>now||now-latestReceipt.ended_at_ms>CONFIG.stale_after_ms)
   reasons.push('STALE_OR_FUTURE_RECEIPT');
  if(!Array.isArray(latestReceipt.gaps)||latestReceipt.gaps.length>CONFIG.max_gaps_per_run)
   reasons.push('MARKET_COVERAGE_GAP');
  if(!Array.isArray(latestReceipt.observations)||latestReceipt.observations.length===0)
   reasons.push('NO_OBSERVATIONS');
  if(ledger&&Array.isArray(ledger.entries)&&
     !ledger.entries.some(e=>e.run_id===String(latestReceipt.run_id)))
   reasons.push('RECEIPT_NOT_LEDGERED');
 }
 const healthy=reasons.length===0;
 return {schema:'mahoraga-v108-research-health-v1',at_ms:now,status:healthy?'EVIDENCE_PIPELINE_CANDIDATE_OK':'FAIL_CLOSED',
  reasons,collection_scheduler_verified:false,independent_attestation_verified:false,
  research_only:true,approved_for_live:false,production_changed:false,
  auto_promotion:false,live_orders:false};
}
module.exports={inspect,CONFIG};
