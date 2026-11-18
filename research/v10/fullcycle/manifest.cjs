'use strict';
// Stages 2 and 12: verifiable export manifest of bounded public research capture.
// Local copies and GitHub artifacts are NOT proof of independent immutable storage.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const required=['raw.jsonl','events.jsonl','health.jsonl','connection-health.jsonl'];
function seal(dir){
 if(!path.isAbsolute(dir))throw Error('Absolute archive directory required');
 const files={};
 for(const name of required){
  const p=path.join(dir,name),stat=fs.statSync(p);
  if(!stat.isFile()||stat.size>200e6)throw Error('Missing/oversized evidence artifact: '+name);
  const bytes=fs.readFileSync(p);
  if(bytes.length&&!bytes.toString('utf8').endsWith('\n'))throw Error('Torn artifact: '+name);
  files[name]={sha256:digest(bytes),bytes:bytes.length};
 }
 const manifest={schema:'invo-v10-bounded-capture-manifest-1',
  sealed_utc:new Date().toISOString(),files,
  externally_anchored:false,complete_market_coverage:false,
  training_approved:false,live_orders:false};
 const file=path.join(dir,'capture-manifest.json');
 if(fs.existsSync(file))throw Error('Manifest already sealed; no overwrite');
 fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});
 return manifest;
}
function verify(dir){
 const manifest=JSON.parse(fs.readFileSync(path.join(dir,'capture-manifest.json'),'utf8'));
 if(manifest.schema!=='invo-v10-bounded-capture-manifest-1'||manifest.training_approved!==false||
 manifest.externally_anchored!==false||Object.keys(manifest.files).sort().join('|')!==required.slice().sort().join('|'))
 throw Error('Untrusted capture manifest');
 for(const [name,data] of Object.entries(manifest.files)){
  const bytes=fs.readFileSync(path.join(dir,name));
  if(digest(bytes)!==data.sha256||bytes.length!==data.bytes)
   throw Error('Exported research evidence modified: '+name);
 }
 return {verified:true,external_storage_proven:false,train_approved:false};
}
module.exports={seal,verify};
