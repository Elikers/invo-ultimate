'use strict';
// Phase C — deterministic abstaining meta-expert; NOT a trained ML ensemble, only a benchmark scaffold.
const {EXPERTS,REGIMES,estimate}=require('./experts.cjs');
function decide(model,decisions,{regime,observedAtMs,minSamples=30,minNetPct=.05}={}){
 if(!REGIMES.includes(regime)||!Number.isSafeInteger(observedAtMs)||
 !Number.isInteger(minSamples)||minSamples<1||!Number.isFinite(minNetPct)||minNetPct<0||
 !Array.isArray(decisions))throw Error('INVALID_SUPERVISOR_INPUT');
 const seen=new Set(),proposals=[];
 for(const d of decisions){
  if(!EXPERTS.includes(d.engine)||seen.has(d.engine)||!['LONG','SHORT','NONE'].includes(d.side)||
   !Number.isSafeInteger(d.observedAtMs)||d.observedAtMs>observedAtMs||
   !Number.isFinite(d.costBps)||d.costBps<0)throw Error('INVALID_OR_FUTURE_SIGNAL');
  seen.add(d.engine);
  if(d.side==='NONE')continue;
  const e=estimate(model,d.engine,regime,d.side);
  proposals.push({engine:d.engine,side:d.side,n:e.n,
   descriptiveNetMeanPct:e.shrunkenHistoricalMeanNetPct,eligible:e.n>=minSamples&&e.shrunkenHistoricalMeanNetPct>minNetPct});
 }
 const eligible=proposals.filter(x=>x.eligible);
 const longs=eligible.filter(x=>x.side==='LONG'),shorts=eligible.filter(x=>x.side==='SHORT');
 const totalLong=longs.reduce((s,x)=>s+x.descriptiveNetMeanPct,0);
 const totalShort=shorts.reduce((s,x)=>s+x.descriptiveNetMeanPct,0);
 const chosen=eligible.length===0?'NONE':totalLong===totalShort?'NONE':totalLong>totalShort?'LONG':'SHORT';
 const conflict=longs.length>0&&shorts.length>0;
 return {schema:'invo-v10-supervisor-shadow-1',side:conflict?'NONE':chosen,
  reason:eligible.length===0?'INSUFFICIENT_OR_NONPOSITIVE_RESEARCH_EVIDENCE':conflict?'EXPERT_DISAGREEMENT':
   chosen==='NONE'?'INDETERMINATE':'DESCRIPTIVE_SCORE_RESEARCH_ONLY',
  proposals,observedAtMs,modelRegistrationId:model.registrationId,
  actualOrder:false,liveReady:false,independentlyValidated:false};
}
module.exports={decide};
