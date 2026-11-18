'use strict';
// Phase B: eight independent interpretable conditional outcome learners. Offline research only.
const EXPERTS=Object.freeze(['fusion','sweep','auction','pullback','volbreak','mean','strict','scalping']);
const REGIMES=Object.freeze(['TREND_UP','TREND_DOWN','RANGE','VOLATILE']);
function validate(row){
 if(!row||!EXPERTS.includes(row.engine)||!REGIMES.includes(row.regime)||
 !['LONG','SHORT','NONE'].includes(row.side)||!Number.isSafeInteger(row.predictedAtMs)||
 !Number.isSafeInteger(row.maturedAtMs)||row.maturedAtMs<=row.predictedAtMs||
 !Number.isFinite(row.netPct)||!Number.isFinite(row.costBps)||row.costBps<0||
 typeof row.registrationId!=='string'||row.registrationId.length<3||
 typeof row.sourceHash!=='string'||!/^[a-f0-9]{64}$/.test(row.sourceHash))throw Error('INVALID_OR_UNMATURED_LABEL');
 if(row.side==='NONE'&&row.netPct!==0)throw Error('ABSTENTION_CANNOT_INFER_PNL');
 return true;
}
function train(rows,{trainEndMs,registrationId,priorCount=20}={}){
 if(!Array.isArray(rows)||!Number.isSafeInteger(trainEndMs)||typeof registrationId!=='string'||
 !Number.isSafeInteger(priorCount)||priorCount<1)throw Error('INVALID_TRAIN_PLAN');
 const stats=Object.fromEntries(EXPERTS.map(e=>[e,{}]));
 const seen=new Set();
 for(const row of rows){
  validate(row);
  if(row.registrationId!==registrationId||row.maturedAtMs>trainEndMs)throw Error('PROTECTED_TEST_OR_FUTURE_LABEL');
  const id=[row.registrationId,row.engine,row.predictedAtMs,row.side].join('|');
  if(seen.has(id))throw Error('DUPLICATED_DECISION');seen.add(id);
  if(row.side==='NONE')continue;
  const k=row.regime+'|'+row.side;
  const s=stats[row.engine][k]??={n:0,netSum:0,netSq:0,grossWins:0,netWins:0};
  s.n++;s.netSum+=row.netPct;s.netSq+=row.netPct**2;s.grossWins+=Number(row.netPct+row.costBps/100>0);
  s.netWins+=Number(row.netPct>0);
 }
 return Object.freeze({schema:'invo-v10-eight-expert-model-1',trainEndMs,registrationId,
  experts:stats,priorCount,offline:true,productionEnabled:false});
}
function estimate(model,engine,regime,side){
 if(!model||model.schema!=='invo-v10-eight-expert-model-1'||!EXPERTS.includes(engine)||
 !REGIMES.includes(regime)||!['LONG','SHORT'].includes(side))throw Error('INVALID_EXPERT_QUERY');
 const s=model.experts[engine][regime+'|'+side]||{n:0,netSum:0,netSq:0,netWins:0};
 const n=s.n,prior=model.priorCount,mean=s.netSum/(n+prior); // shrink toward no edge
 const variance=n>1?Math.max(0,(s.netSq-s.netSum*s.netSum/n)/(n-1)):null;
 // The interval is descriptive only, not an independent/confidence-qualified prediction.
 return {engine,regime,side,n,shrunkenHistoricalMeanNetPct:mean,
  sampleVariance:variance,netWins:s.netWins,validatedForwardEdge:false};
}
module.exports={EXPERTS,REGIMES,train,estimate};
