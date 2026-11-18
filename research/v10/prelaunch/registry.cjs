'use strict';
// Phase D — immutable offline registry/challenger decision; no production authority.
const crypto=require('node:crypto');
function canonical(v){if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';return JSON.stringify(v);}
function fingerprint(obj){return crypto.createHash('sha256').update(canonical(obj)).digest('hex');}
function register(state,model,{createdAtMs,trainEndMs}){
 if(!state||!Array.isArray(state.history)||!Number.isSafeInteger(createdAtMs)||
 !Number.isSafeInteger(trainEndMs)||trainEndMs>createdAtMs||model?.productionEnabled!==false||
 model?.schema!=='invo-v10-eight-expert-model-1'||model.trainEndMs!==trainEndMs)
 throw Error('INVALID_RESEARCH_CHECKPOINT');
 const id=fingerprint(model);
 if(state.history.some(x=>x.id===id))throw Error('DUPLICATE_CHECKPOINT');
 const entry={id,createdAtMs,trainEndMs,registrationId:model.registrationId,model,
  status:'CHALLENGER',productionAuthorized:false};
 return {history:[...state.history,entry],championId:state.championId||null};
}
function inspectDrift(recent,{minN=30,warnNegativePct=-.05}={}){
 if(!Array.isArray(recent)||!Number.isInteger(minN)||minN<2)throw Error('INVALID_DRIFT_SAMPLE');
 if(recent.some(x=>!Number.isFinite(x.netPct)))throw Error('MISSING_NET_OUTCOME');
 if(recent.length<minN)return {status:'INSUFFICIENT_OUTCOMES',n:recent.length,meanNetPct:null};
 const mean=recent.reduce((s,x)=>s+x.netPct,0)/recent.length;
 return {status:mean<warnNegativePct?'REVIEW_CHAMPION_FOR_DRIFT':'NO_NEGATIVE_DRIFT_TRIGGER',n:recent.length,
  meanNetPct:mean,warning:'Heuristic alarm only, not a statistical change-point test or approval.'};
}
function evaluateChallenger(state,id,evidence){
 const candidate=state.history.find(x=>x.id===id);
 if(!candidate||candidate.status!=='CHALLENGER')throw Error('UNKNOWN_CHALLENGER');
 const checks=['preregistered','strictly_forward','independent_costs','matched_baseline',
  'uncertainty_checked','drawdown_checked','no_test_training'];
 const missing=checks.filter(k=>evidence?.[k]!==true);
 if(!Number.isInteger(evidence?.closed)||evidence.closed<100)missing.push('UNDER_100_CLOSED');
 if(!Number.isFinite(evidence?.lowerCi95NetPct)||evidence.lowerCi95NetPct<=0)missing.push('NO_POSITIVE_NET_LOWER_BOUND');
 return {candidateId:id,status:missing.length?'HOLD':'ELIGIBLE_FOR_SEPARATE_HUMAN_REVIEW',
  blockers:missing,automaticPromotion:false,productionAuthorized:false,rollbackPossible:state.championId!==null};
}
function offlineRollback(state,targetId){
 if(!state.history.some(x=>x.id===targetId))throw Error('CHECKPOINT_NOT_FOUND');
 return {...state,championId:targetId,notes:'RESEARCH_ONLY; production deployment prohibited'};
}
module.exports={fingerprint,register,inspectDrift,evaluateChallenger,offlineRollback};
