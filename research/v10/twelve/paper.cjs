'use strict';
// Separate multi-engine outcome journal. Does NOT alter the earlier single-engine schema.
// Commit outcome against earlier observation and independently sourced future completed bars.
const crypto=require('node:crypto'),R=require('../shadow/registration.json'),S=require('../shadow/shadow.cjs');
const sha=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function paperExit({side,entry,completedBars,stopPct=1,targetPct=1.5,holdBars=12}){
 if(!['LONG','SHORT','NONE'].includes(side))throw Error('Invalid side');
 if(side==='NONE')return {kind:'NO_TRADE',gross_pct:null,reason:'ABSTAIN'};
 if(!Number.isFinite(entry)||entry<=0||!Array.isArray(completedBars)||completedBars.length<holdBars||
 !Number.isSafeInteger(holdBars)||holdBars<1||holdBars>12||
 stopPct!==1||targetPct!==1.5)throw Error('Frozen paper rule mismatch');
 let exit=null,exitIndex=holdBars-1,reason='TIME_EXIT';
 for(let i=0;i<holdBars;i++){
  const b=completedBars[i];
  if(!Number.isSafeInteger(b.available_ms)||!Number.isFinite(b.high)||!Number.isFinite(b.low)||
   !Number.isFinite(b.close)||b.high<b.low||b.low<=0||b.close<=0)throw Error('Bad completed bar');
  const lowStop=side==='LONG'?entry*(1-stopPct/100):entry*(1+stopPct/100);
  const highTarget=side==='LONG'?entry*(1+targetPct/100):entry*(1-targetPct/100);
  const stop=side==='LONG'?b.low<=lowStop:b.high>=lowStop;
  const target=side==='LONG'?b.high>=highTarget:b.low<=highTarget;
  // Conservative rule: stop wins priority when both touched in same bar.
  if(stop||target){exit=stop?lowStop:highTarget;exitIndex=i;reason=stop?'STOP_PRIORITY':'TARGET';break;}
 }
 if(exit===null)exit=completedBars[holdBars-1].close;
 const gross=100*(side==='LONG'?exit/entry-1:entry/exit-1);
 return {kind:'PAPER_SIMULATED',gross_pct:gross,exitIndex,reason};
}
function cost({fee_bps,spread_bps,slippage_bps,funding_bps=0,source}){
 const a=[fee_bps,spread_bps,slippage_bps,funding_bps];
 if(a.some(v=>!Number.isFinite(v)||Math.abs(v)>250)||fee_bps<0||spread_bps<0||slippage_bps<0||
 typeof source!=='string'||!['ASSUMED_PAPER','VERIFIED_OBSERVED_QUOTE'].includes(source))
 throw Error('Unverified economic cost assumption');
 return {total_bps:a.reduce((s,v)=>s+v,0),costs:{fee_bps,spread_bps,slippage_bps,funding_bps},
  source,real_execution_verified:false};
}
function settle(observation,{entry,completedBars,costs,recordedAtMs,modelVersionHashes}){
 if(!observation||observation.type!=='OBSERVATION'||!R.markets.includes(observation.market)||
 !Number.isSafeInteger(recordedAtMs)||recordedAtMs<observation.mature_after_ms||
 !Array.isArray(completedBars)||completedBars.length<12||
 completedBars.some((x,i)=>!Number.isSafeInteger(x.available_ms)||
  x.available_ms>recordedAtMs||x.available_ms<=observation.predicted_at_ms||
  (i>0&&x.available_ms<=completedBars[i-1].available_ms)))
 throw Error('Premature/missing future completed bar evidence');
 const c=cost(costs);
 if(!modelVersionHashes||observation.decisions.some(x=>modelVersionHashes[x.engine]!==x.version_sha256))
 throw Error('Model version mismatch with forward predictions');
 const labels=observation.decisions.map(d=>{
  const result=paperExit({side:d.side,entry,completedBars});
  const exitAvailable=result.kind==='NO_TRADE'?observation.mature_after_ms:
    completedBars[result.exitIndex].available_ms;
  if(exitAvailable>recordedAtMs)throw Error('Unmatured paper exit');
  return {engine:d.engine,side:d.side,model_version_sha256:d.version_sha256,
   label_type:result.kind,gross_paper_pct:result.gross_pct,
   assumed_cost_bps:result.kind==='NO_TRADE'?0:c.total_bps,
   net_paper_pct:result.kind==='NO_TRADE'?null:result.gross_pct-c.total_bps/100,
   actual_exchange_fill:false,cost_source:c.source,exit_reason:result.reason,
   exit_available_ms:exitAvailable};
 });
 return {schema:'invo-v10-multi-engine-paper-label-1',
  observation_id:observation.id,observation_sha256:sha(observation),
  recorded_at_ms:recordedAtMs,labels,freeze_rule:'1% STOP, 1.5% TARGET, 12 COMPLETED BARS',
  costs:c,training_approved:false,forward_test_independent:false,live_orders:false};
}
module.exports={paperExit,cost,settle,sha};
