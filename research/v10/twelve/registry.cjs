'use strict';
// Registered research checkpoints/champion freeze and challenger rollback.
// No branch merging or model deployment occurs here.
const crypto=require('node:crypto'),REG=require('../learners/registration.json'),
 M=require('../learners/specialists.cjs'),G=require('../governance/governance.cjs');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function enroll(expert){
 if(!REG.experts.includes(expert))throw Error('Unknown expert');
 const champion=M.create(expert,'v10-frozen-research-champion');
 return {schema:'invo-v10-safe-model-registry-1',expert,champion,
  challenger:structuredClone(champion),version:0,history:[],
  production_eligible:false,auto_promotion:false};
}
function proposal(state,candidate,trainingProof){
 if(state?.schema!=='invo-v10-safe-model-registry-1'||candidate?.expert!==state.expert||
 !Number.isSafeInteger(candidate.version)||candidate.version<0||
 !Array.isArray(candidate.weights)||candidate.weights.some(x=>!Number.isFinite(x))||
 trainingProof?.source!=='AUDITED_MATURED_TRAIN_ONLY'||
 !Number.isSafeInteger(trainingProof.eligible_rows)||trainingProof.eligible_rows<1||
 !/^[a-f0-9]{64}$/.test(trainingProof.registration_sha256))
 throw Error('Unsafe challenger checkpoint request');
 const prior=hash(state.champion),next=hash(candidate);
 if(prior===next)throw Error('No challenger delta');
 const history=[...state.history,{seq:state.history.length+1,champion_sha256:prior,
  challenger_sha256:next,training_proof_sha256:hash(trainingProof),
  approval:'RESEARCH_ONLY_NOT_PROMOTED'}];
 return {...state,challenger:structuredClone(candidate),version:state.version+1,history};
}
function review(state,paired){
 const current={model_sha256:hash(state.champion)},next={model_sha256:hash(state.challenger)};
 const result=G.challenge(current,next,paired);
 return {action:result.action,automatic_promotion:false,
  actual_live_activation:false,champion_preserved:true,production_eligible:false};
}
function rollback(state){
 if(state?.schema!=='invo-v10-safe-model-registry-1')throw Error('Unregistered model');
 return {...state,challenger:structuredClone(state.champion),version:state.version+1,
  history:[...state.history,{seq:state.history.length+1,
  action:'CHALLENGER_ROLLBACK_TO_FROZEN_CHAMPION',champion_sha256:hash(state.champion)}]};
}
module.exports={enroll,proposal,review,rollback,hash};
