'use strict';
// v10.9 within existing research branch: deterministic maturity state, no fake fills.
// Only real received public quotes within exact registered window can price outcomes.
const F=require('../forward/forward.cjs'),R=require('../forward/registration.json');
const A=require('../forward/audit.cjs');
function fail(s){throw Error(s)}
function verify(capture,frames){
 if(capture?.schema!=='mahoraga-v103-capture-receipt-v1')fail('Invalid capture schema');
 return A.audit(capture,frames);
}
function init(capture,frames){
 verify(capture,frames);
 return {capture,frames,labels:new Map(),exitSources:{},attempts:[],
   completed:false};
}
function ingest(state,raw,receiptAt,now){
 if(state.completed)fail('Maturity state already sealed');
 if(typeof raw!=='string'||!Number.isSafeInteger(receiptAt)||!Number.isSafeInteger(now)||receiptAt>now)
   return {status:'REJECT_INVALID_RECEIPT'};
 let source;
 try{source=F.source(raw,receiptAt,now)}catch{return {status:'REJECT_INVALID_OR_STALE_SOURCE'}}
 const market=source.b.coin;
 const obs=state.capture.observations.find(x=>x.market===market);
 if(!obs)return {status:'UNREGISTERED_OR_GAP_MARKET'};
 if(state.labels.has(obs.id))return {status:'DUPLICATE_IGNORED'};
 if(obs.side==='NONE')return {status:'ABSTENTION_NOT_A_TRADE'};
 if(receiptAt<obs.mature_after_ms)return {status:'PREMATURE_QUOTE_REJECTED'};
 if(receiptAt>obs.mature_after_ms+R.exit_tolerance_ms)return {status:'LATE_QUOTE_REJECTED'};
 const label=F.mature(obs,raw,receiptAt,now);
 if(label.status!=='PAPER_OUTCOME_WITH_FUNDING_UNKNOWN')
   return {status:'REJECT_UNUSABLE_EXIT_SOURCE'};
 state.labels.set(obs.id,label);
 state.exitSources[market]={raw,received_at_ms:receiptAt,source_sha256:F.hash(raw)};
 return {status:'CAUSAL_PAPER_QUOTE_ACCEPTED',market,id:obs.id};
}
function finalize(state,now,reason='MATURITY_WINDOW_FINISHED'){
 if(state.completed)fail('Already finalized');
 if(!Number.isSafeInteger(now))fail('Invalid clock');
 for(const o of state.capture.observations){
  if(now<o.mature_after_ms)fail('Cannot label before maturity');
  if(o.side!=='NONE'&&!state.labels.has(o.id)&&
     now<o.mature_after_ms+R.exit_tolerance_ms)
     fail('Missing-data labels require complete exit tolerance window');
  if(!state.labels.has(o.id))
    state.labels.set(o.id,F.mature(o,null,null,now));
 }
 state.completed=true;
 const receiptBytes=JSON.stringify(state.capture,null,2)+'\n';
 const result={schema:'mahoraga-v103-paper-outcome-receipt-v1',
  source_capture_run_id:state.capture.run_id,
  outcome_capture_run_id:process.env.GITHUB_RUN_ID||null,
  reason,created_at_ms:now,source_receipt_sha256:F.hash(receiptBytes),
  outcomes:state.capture.observations.map(o=>state.labels.get(o.id)),
  exitSources:state.exitSources,
  forward_paper_results:[...state.labels.values()].filter(x=>x.status==='PAPER_OUTCOME_WITH_FUNDING_UNKNOWN').length,
  independent_external_attestation:false,portfolio_profitability_verified:false,
  training_eligible:false,approved_for_live:false,no_live_orders:true};
 const audit=A.audit(state.capture,state.frames,[result]);
 if(audit.pending_labels!==0||audit.matched_labels!==state.capture.observations.length)
  fail('Unmatched outcome in final ledger');
 return {result,audit};
}
module.exports={init,ingest,finalize,verify};
