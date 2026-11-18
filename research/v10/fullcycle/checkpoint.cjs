'use strict';
// Stage 10: local research-only atomic checkpoint, lineage, integrity and rollback to
// a previous CHALLENGER checkpoint. Never rolls back or edits production code.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function fail(x){throw Error(x)}
function save(root,models,label,previous=null){
 if(typeof root!=='string'||!path.isAbsolute(root)||!/^[-a-z0-9_]{5,60}$/i.test(label)||
 models?.schema!=='invo-v10-multi-challengers-1')fail('Unsafe checkpoint arguments');
 fs.mkdirSync(root,{recursive:true,mode:0o700});
 const file=path.join(root,label+'.json');
 if(fs.existsSync(file))fail('Immutable checkpoint exists');
 const record={schema:'invo-v10-challenger-checkpoint-1',label,previous,
  models,created_utc:new Date().toISOString(),production_eligible:false};
 record.sha256=sha(record);
 const tmp=file+'.tmp';let fd;
 try{
  fd=fs.openSync(tmp,'wx',0o600);
  const b=Buffer.from(JSON.stringify(record)+'\n');
  if(fs.writeSync(fd,b)!==b.length)fail('Checkpoint truncated');
  fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;
  fs.renameSync(tmp,file);
  const d=fs.openSync(root,'r');try{fs.fsyncSync(d)}finally{fs.closeSync(d)}
 }catch(err){
  if(fd!==undefined)fs.closeSync(fd);
  try{fs.unlinkSync(tmp)}catch{}throw err;
 }
 return {file,sha256:record.sha256,production_written:false};
}
function load(root,label,expected=null){
 if(!/^[-a-z0-9_]{5,60}$/i.test(label))fail('Invalid checkpoint name');
 const f=path.join(root,label+'.json'),r=JSON.parse(fs.readFileSync(f,'utf8'));
 const {sha256,...content}=r;
 if(r.schema!=='invo-v10-challenger-checkpoint-1'||sha(content)!==sha256||
 expected&&expected!==sha256||r.models?.schema!=='invo-v10-multi-challengers-1'||
 r.production_eligible!==false)fail('Checkpoint integrity or privilege failure');
 return r;
}
function restore(root,fromLabel,expectedSha){
 const previous=load(root,fromLabel,expectedSha);
 return {state:structuredClone(previous.models),restored_research_sha256:previous.sha256,
  auto_promotion:false,live_orders:false,needs_human_review:true};
}
module.exports={save,load,restore,sha};
