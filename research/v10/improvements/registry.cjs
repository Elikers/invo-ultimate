'use strict';
// v10.3 research-only model snapshot storage. Immutable files + hash integrity. NEVER active production config.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function check(model){
 if(!model||!['invo-v10-online-specialist-1','invo-v10-meta-learner-1'].includes(model.schema)||
 !Array.isArray(model.weights)||!model.weights.length||
 model.weights.some(w=>!Number.isFinite(w))||!Number.isFinite(model.bias)||
 !Number.isSafeInteger(model.version)||model.version<0)throw Error('Untrusted model checkpoint');
}
function save(folder,model,provenance){
 check(model);
 if(!provenance||!['EXPERT_TRAIN','META_TRAIN'].includes(provenance.locked_stage)||
 !/^[a-f0-9]{64}$/.test(provenance.dataset_sha256)||provenance.independent_forward_validated!==false)
 throw Error('Missing historical-only provenance');
 const file={schema:'mahoraga-v10-research-checkpoint-1',research_only:true,
  production_active:false,orders_authorized:false,training_provenance:provenance,model};
 const body=JSON.stringify(file),key=hash(body),dir=path.join(folder,'models');
 fs.mkdirSync(dir,{recursive:true});
 const out=path.join(dir,key+'.json');
 if(fs.existsSync(out)){
  if(fs.readFileSync(out,'utf8')!==body)throw Error('Checkpoint hash collision/tamper');
 }else{
  const fd=fs.openSync(out,'wx',0o600);
  try{fs.writeSync(fd,body);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 }
 return {fingerprint:key,path:out,source:'HISTORICAL_TRAINING_ONLY',production_eligible:false};
}
function load(folder,key){
 if(!/^[a-f0-9]{64}$/.test(key))throw Error('Invalid checkpoint fingerprint');
 const body=fs.readFileSync(path.join(folder,'models',key+'.json'),'utf8');
 if(hash(body)!==key)throw Error('Checkpoint integrity mismatch');
 const item=JSON.parse(body);check(item.model);
 if(item.research_only!==true||item.production_active!==false||item.orders_authorized!==false)
 throw Error('Checkpoint privilege mismatch');
 return item;
}
function compareResearchVersions(a,b){
 check(a);check(b);
 return {version_a:a.version,version_b:b.version,are_identical:hash(JSON.stringify(a))===hash(JSON.stringify(b)),
  action:'HUMAN_REVIEW_ONLY_NO_AUTOMATIC_ROLLBACK_OR_PROMOTION'};
}
module.exports={save,load,compareResearchVersions};
