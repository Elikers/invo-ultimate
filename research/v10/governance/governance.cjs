'use strict';
/* Research challenger governance. Outputs review-only decisions, NEVER model deployment. */
const crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function checkpoint(model,proof){
 if(!model||!Array.isArray(model.weights)||model.weights.some(w=>!Number.isFinite(w))||
 !Number.isSafeInteger(model.version)||typeof proof?.registration_sha!=='string'||
 !/^[a-f0-9]{40}$/.test(proof.registration_sha))throw Error('Unversioned model/registration');
 return Object.freeze({model_sha256:sha(model),model_version:model.version,registration_sha:proof.registration_sha,
  parent_sha256:proof.parent_sha256||null,research_only:true,production_eligible:false});
}
function drift(recent,reference){
 if(!Array.isArray(recent)||!Array.isArray(reference)||recent.length<30||reference.length<30)
 return {status:'INSUFFICIENT_CLUSTERED_OUTCOMES',drift_flagged:false};
 if([...recent,...reference].some(x=>!Number.isFinite(x)||x<0||x>1))throw Error('Invalid matured loss indicators');
 const a=recent.reduce((s,x)=>s+x,0)/recent.length,b=reference.reduce((s,x)=>s+x,0)/reference.length;
 // Simple conservative operational alert, NOT a valid p-value or economic proof.
 return {status:'DESCRIPTIVE_DRIFT_MONITOR_ONLY',drift_flagged:(a-b)>.25,
  recent_loss_rate:a,reference_loss_rate:b,statistical_significance_claimed:false};
}
function challenge(champion,challenger,paired){
 if(!champion||!challenger||champion.model_sha256===challenger.model_sha256||
 !Array.isArray(paired)||paired.length<30)return {action:'HOLD_CHAMPION',reason:'NO_INDEPENDENT_PAIRED_SAMPLE'};
 if(paired.some(x=>!Number.isFinite(x.champion_net_pct)||!Number.isFinite(x.challenger_net_pct)||
 !x.pre_registered||!x.forward_only||!x.costs_verified||!x.matured||x.from_training))
 return {action:'HOLD_CHAMPION',reason:'PAIRED_PROVENANCE_INVALID'};
 const diffs=paired.map(x=>x.challenger_net_pct-x.champion_net_pct);
 const mean=diffs.reduce((s,x)=>s+x,0)/diffs.length;
 if(mean<=0)return {action:'ROLLBACK_CHALLENGER_RESEARCH',reason:'NO_MEAN_PAIRED_IMPROVEMENT',
  paired_n:paired.length,mean_net_difference_pct:mean,automatic_promotion:false};
 // Deliberately conservative: positive alone is not sufficient.
 return {action:'INDEPENDENT_AUDIT_REQUIRED',reason:'UNCERTAINTY_AND_DEPENDENCE_NOT_ESTABLISHED',
  paired_n:paired.length,mean_net_difference_pct:mean,automatic_promotion:false};
}
module.exports={checkpoint,drift,challenge};
