'use strict';
// Append-only research feedback ledger: predictions cannot be modified by outcomes.
const {stableHash}=require('../data/provenance.cjs');
function start(registrationId){if(typeof registrationId!=='string'||registrationId.length<3)throw Error('REGISTRATION_REQUIRED');
 return {schema:'invo-v10-feedback-journal-1',registrationId,decisions:[],outcomes:[],researchOnly:true};}
function record(j,d){
 if(j?.schema!=='invo-v10-feedback-journal-1'||!d||typeof d.engine!=='string'||
 !Number.isSafeInteger(d.observedAtMs)||!Number.isSafeInteger(d.predictedHorizonMs)||d.predictedHorizonMs<60000||
 !['LONG','SHORT','NONE'].includes(d.side)||typeof d.modelSha!=='string'||!/^([0-9a-f]{40}|[0-9a-f]{64})$/.test(d.modelSha)||
 !Array.isArray(d.inputRawShas)||d.inputRawShas.length<1||d.inputRawShas.some(x=>!/^[a-f0-9]{64}$/.test(x))||
 d.registrationId!==j.registrationId)throw Error('INVALID_PREDICTION_PROVENANCE');
 const id=stableHash(JSON.stringify([d.registrationId,d.engine,d.market,d.observedAtMs,d.modelSha]));
 if(j.decisions.some(x=>x.id===id))throw Error('REPEATED_DECISION');
 const entry=Object.freeze({id,...d,modelType:'SHADOW_ONLY',liveTrade:false,registeredBeforePrediction:true});
 return {...j,decisions:[...j.decisions,entry]};
}
function settle(j,{decisionId,observedAtMs,netPct,costBps,outcomePriceSourceSha}){
 if(j?.schema!=='invo-v10-feedback-journal-1'||typeof decisionId!=='string'||
 !Number.isSafeInteger(observedAtMs)||!Number.isFinite(netPct)||!Number.isFinite(costBps)||costBps<0||
 !/^[a-f0-9]{64}$/.test(String(outcomePriceSourceSha||'')))throw Error('BAD_OUTCOME_EVIDENCE');
 const d=j.decisions.find(x=>x.id===decisionId);if(!d)throw Error('UNREGISTERED_PREDICTION');
 if(j.outcomes.some(x=>x.decisionId===decisionId))throw Error('DUPLICATE_SETTLEMENT');
 if(observedAtMs<d.observedAtMs+d.predictedHorizonMs)throw Error('OUTCOME_NOT_MATURED');
 if(d.side==='NONE'&&netPct!==0)throw Error('NO_TRADE_CANNOT_HAVE_PNL');
 return {...j,outcomes:[...j.outcomes,Object.freeze({decisionId,observedAtMs,netPct,costBps,
  outcomePriceSourceSha,actualFill:false,accountPnl:false,mode:'PAPER_RESEARCH_LABEL_ONLY'})]};
}
function trainingRows(j,trainEndMs,regimeByDecisionId){
 if(j?.schema!=='invo-v10-feedback-journal-1'||!Number.isSafeInteger(trainEndMs))throw Error('BAD_TRAIN_SPLIT');
 const rows=[];
 for(const o of j.outcomes){
  const d=j.decisions.find(x=>x.id===o.decisionId);
  if(o.observedAtMs>trainEndMs)continue;
  const regime=regimeByDecisionId[o.decisionId];if(!regime)throw Error('MISSING_PAST_ONLY_REGIME');
  rows.push({engine:d.engine,side:d.side,regime,predictedAtMs:d.observedAtMs,
   maturedAtMs:o.observedAtMs,netPct:o.netPct,costBps:o.costBps,
   registrationId:j.registrationId,sourceHash:o.outcomePriceSourceSha});
 }
 return rows;
}
module.exports={start,record,settle,trainingRows};
