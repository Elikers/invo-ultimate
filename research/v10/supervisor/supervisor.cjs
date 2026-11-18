'use strict';
/* Research-only MAHORAGA mixture of experts. Returns an advisory paper decision, NEVER an order. */
const REG=require('../learners/registration.json');
const EXP=new Set(REG.experts);
function decide(observations,options={}){
 if(!Array.isArray(observations))throw Error('No expert observations');
 const minProb=options.minProbability??0.56,margin=options.minMargin??0.08,maxSpread=options.maxSpreadBps??20;
 if(!Number.isFinite(minProb)||minProb<0.5||minProb>0.95||!Number.isFinite(margin)||margin<0||margin>0.5||
 !Number.isFinite(maxSpread)||maxSpread<=0||maxSpread>100)throw Error('Unsafe decision threshold');
 const names=new Set(),valid=[];
 for(const x of observations){
  if(!EXP.has(x.expert)||names.has(x.expert)||!['LONG','SHORT','NONE'].includes(x.side)||
   !Number.isFinite(x.probability)||x.probability<0||x.probability>1||
   !Number.isFinite(x.reliability)||x.reliability<0||x.reliability>1||
   !Number.isSafeInteger(x.predicted_at_ms)||x.predicted_at_ms<=0||
   typeof x.model_fingerprint!=='string'||!/^[0-9a-f]{64}$/.test(x.model_fingerprint))
   throw Error('Invalid or duplicate expert provenance');
  names.add(x.expert);valid.push(x);
 }
 const deny=(reason,counts={long:0,short:0})=>({schema:'invo-v10-mahoraga-advisory-1',side:'NONE',reason,counts,
  research_only:true,trade_authorized:false,production_write_allowed:false,model_training:false});
 if(options.data_valid!==true||options.costs_verified!==true)return deny('DATA_OR_COSTS_NOT_VERIFIED');
 if(!Number.isFinite(options.spread_bps)||options.spread_bps>maxSpread)return deny('SPREAD_UNSAFE_OR_UNKNOWN');
 if(valid.length<3)return deny('INSUFFICIENT_INDEPENDENT_EXPERTS');
 const times=valid.map(x=>x.predicted_at_ms);
 if(Math.max(...times)-Math.min(...times)>1000)return deny('ASYNCHRONOUS_EXPERT_INPUTS');
 let long=0,short=0;
 for(const x of valid){
  if(x.side==='NONE')continue;
  const strength=Math.max(0,(x.probability-0.5)*2);
  const w=strength*x.reliability;
  if(x.side==='LONG')long+=w;else short+=w;
 }
 const sum=long+short;if(sum===0)return deny('NO_VALID_EDGE',{long,short});
 const normalized=Math.max(long,short)/sum;
 if(normalized<minProb||Math.abs(long-short)/sum<margin)
  return deny('EXPERT_DISAGREEMENT_OR_LOW_CONFIDENCE',{long,short});
 return {schema:'invo-v10-mahoraga-advisory-1',
  side:long>short?'LONG':'SHORT',reason:'SIMULATED_EXPERT_WEIGHTED_DIRECTION',
  counts:{long,short},relative_support:normalized,estimated_net_expectancy:null,
  research_only:true,trade_authorized:false,production_write_allowed:false,model_training:false};
}
module.exports={decide};
