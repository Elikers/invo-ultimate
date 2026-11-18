'use strict';
/* Local research challenger state; atomic checkpoints with one-writer lock.
 * An unchanged model is not re-written; no account, wallet, network or production operations.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const A=require('./loop.cjs'),S=require('../shadow/shadow.cjs');
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const cleanDir=dir=>{if(typeof dir!=='string'||!path.isAbsolute(dir))throw Error('Absolute research directory required')};
function readJsonl(file){
 if(!fs.existsSync(file))throw Error('Required prospective evidence file is missing');
 const raw=fs.readFileSync(file,'utf8');
 if(raw.length&& !raw.endsWith('\n'))throw Error('Evidence journal truncated');
 return raw.trim()?raw.trim().split('\n').map(x=>JSON.parse(x)):[];
}
function readState(dir,expert){
 cleanDir(dir);
 const file=path.join(dir,expert+'-challenger.json');
 if(!fs.existsSync(file))return A.init(expert);
 const data=JSON.parse(fs.readFileSync(file,'utf8'));
 if(!data||typeof data.sha256!=='string'||digest(data.state)!==data.sha256||
 data.state.schema!=='invo-v10-auto-challenger-1'||data.state.expert!==expert||
 data.state.no_production_write!==true||
 !Array.isArray(data.state.processed_ids)||
 new Set(data.state.processed_ids).size!==data.state.processed_ids.length)
 throw Error('Model checkpoint invalid or damaged');
 return data.state;
}
function persist(file,state){
 const text=JSON.stringify({schema:'invo-v10-auto-checkpoint-1',
  state,sha256:digest(state),saved_at_utc:new Date().toISOString()},null,2)+'\n';
 const tmp=file+'.tmp-'+process.pid;
 const fd=fs.openSync(tmp,'wx',0o600);
 try{
  const bytes=Buffer.from(text);
  if(fs.writeSync(fd,bytes)!==bytes.length)throw Error('Partial checkpoint');
  fs.fsyncSync(fd);
 }finally{fs.closeSync(fd)}
 fs.renameSync(tmp,file);
 const fdDir=fs.openSync(path.dirname(file),'r');try{fs.fsyncSync(fdDir)}finally{fs.closeSync(fdDir)}
}
function step(dir,expert,journalFile,rowsFile,now=Date.now()){
 cleanDir(dir);fs.mkdirSync(dir,{recursive:true,mode:0o700});
 const lock=path.join(dir,'.learning-writer.lock');
 let fd;try{fd=fs.openSync(lock,'wx',0o600)}
 catch{throw Error('Research training already running or stale lock; stop for review')}
 try{
  const state=readState(dir,expert);
  const evidence=readJsonl(journalFile),rows=JSON.parse(fs.readFileSync(rowsFile,'utf8'));
  S.check(evidence);
  const result=A.advance(state,evidence,rows,now);
  const dest=path.join(dir,expert+'-challenger.json');
  if(result.report.accepted_for_training>0)persist(dest,result.next);
  return {...result.report,checkpoint_written:result.report.accepted_for_training>0,
   persistent_runtime_active:false,auto_promotion:false};
 }finally{fs.closeSync(fd);fs.unlinkSync(lock)}
}
module.exports={readJsonl,readState,step,digest};
