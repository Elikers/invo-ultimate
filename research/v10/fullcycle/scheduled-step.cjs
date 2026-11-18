'use strict';
// Stage 9-10: resumable, bounded research-only auto challenger step.
// A caller may schedule this in an independently approved runtime; this module never schedules itself.
const fs=require('node:fs'),path=require('node:path');
const T=require('./train.cjs'),C=require('./checkpoint.cjs'),P=require('./pipeline.cjs');
function trainingStep(root,now=Date.now()){
 if(!path.isAbsolute(root)||!Number.isSafeInteger(now))throw Error('Valid absolute research storage and clock required');
 fs.mkdirSync(root,{recursive:true,mode:0o700});
 const guard=path.join(root,'.fullcycle-train.lock');
 let fd;try{fd=fs.openSync(guard,'wx',0o600)}
 catch{throw Error('Research challenger lock held or stale; no training')}
 try{
  const modelDir=path.join(root,'research-models'),pointer=path.join(root,'research-model-latest.json');
  let state=T.init(),revision=0;
  if(fs.existsSync(pointer)){
   const marker=JSON.parse(fs.readFileSync(pointer,'utf8'));
   if(!Number.isSafeInteger(marker.revision)||marker.revision<1||
    typeof marker.label!=='string'||typeof marker.sha256!=='string')
    throw Error('Corrupt checkpoint pointer');
   const checkpoint=C.load(modelDir,marker.label,marker.sha256);
   state=checkpoint.models;revision=marker.revision;
  }
  const log=P.readLedger(path.join(root,'multi-shadow.jsonl'));
  const result=T.train(state,log,now);
  if(result.report.new_challenger_updates===0)
   return {...result.report,status:'NO_NEW_ELIGIBLE_PAPER_OUTCOMES',
    checkpoint_reused:revision>0,revision,
    persistent_external_service:false,orders_enabled:false};
  revision++;
  const label='research-version-'+String(revision).padStart(6,'0');
  const saved=C.save(modelDir,result.next,label,revision>1?'research-version-'+String(revision-1).padStart(6,'0'):null);
  const next={revision,label,sha256:saved.sha256,updated_at_ms:now,external_anchor_verified:false};
  const tmp=pointer+'.tmp';
  fs.writeFileSync(tmp,JSON.stringify(next,null,2)+'\n',{flag:'wx',mode:0o600});
  const sf=fs.openSync(tmp,'r');try{fs.fsyncSync(sf)}finally{fs.closeSync(sf)}
  fs.renameSync(tmp,pointer);
  const dir=fs.openSync(root,'r');try{fs.fsyncSync(dir)}finally{fs.closeSync(dir)}
  return {...result.report,status:'RESEARCH_CHALLENGER_CHECKPOINTED',
   revision,checkpoint_sha256:saved.sha256,
   champion_changed:false,automatic_promotion:false,orders_enabled:false,
   external_clock_anchor_verified:false};
 }finally{fs.closeSync(fd);fs.unlinkSync(guard)}
}
module.exports={trainingStep};
