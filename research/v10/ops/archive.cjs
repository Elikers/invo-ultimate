'use strict';
// Release and artifact archive preparation; no backfill, model update, wallet, or orders.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const F=require('../forward/forward.cjs'),A=require('../forward/audit.cjs');
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const fail=x=>{throw Error(x)};
function stage(root,runId){
 if(!/^[0-9]{8,16}$/.test(String(runId)))fail('Invalid GitHub run ID');
 const bytes=fs.readFileSync(path.join(root,'capture-receipt.json'));
 const receipt=JSON.parse(bytes.toString('utf8'));
 const checksum=fs.readFileSync(path.join(root,'capture-receipt.sha256'),'utf8').trim().split(/\s+/)[0];
 if(digest(bytes)!==checksum)fail('Capture receipt SHA mismatch');
 if(receipt.run_id!==String(runId))fail('Capture run ID mismatch');
 const sourceBytes=fs.readFileSync(path.join(root,'selected-public-frames.json'));
 const frames=JSON.parse(sourceBytes);
 const audit=A.audit(receipt,frames,[]);
 if(audit.observations>0 && receipt.started_at_ms<F.START)fail('Pre-registration sample');
 if(!Number.isSafeInteger(receipt.ended_at_ms)||receipt.ended_at_ms<receipt.started_at_ms)
   fail('Invalid capture clocks');
 const files=[
  {name:'capture-receipt.json',sha256:digest(bytes),bytes:bytes.length},
  {name:'selected-public-frames.json',sha256:digest(sourceBytes),bytes:sourceBytes.length}
 ];
 return {schema:'mahoraga-v104-research-archive-v1',source_run_id:String(runId),
   publisher:R_UNVERIFIED(),registration_sha256:receipt.registration_sha256,
   observed: audit.observations,gaps:audit.source_gaps,files,
   training_eligible:false,independent_external_anchor:false,
   external_backup_verified:false,live_orders:false,approved_for_live:false,
   retention:'GITHUB_RELEASE_ASSETS_NOT_IMMUTABLE_OR_OFFSITE'};
}
function R_UNVERIFIED(){return 'PUBLIC_WEBSOCKET_GITHUB_RUN_RECEIPT_NOT_INDEPENDENT_ATTESTATION'}
function verifyArchive(manifest,root){
 if(manifest?.schema!=='mahoraga-v104-research-archive-v1'||manifest.live_orders!==false||
    manifest.training_eligible!==false||manifest.approved_for_live!==false||
    manifest.independent_external_anchor!==false||manifest.external_backup_verified!==false)fail('Invalid manifest');
 for(const f of manifest.files){
  if(!/^[a-z0-9.-]+$/.test(f.name)||digest(fs.readFileSync(path.join(root,f.name)))!==f.sha256)
   fail('Archive file tampered or missing: '+f.name);
 }
 return true;
}
function write(root,runId){
 const manifest=stage(root,runId);
 const dest=path.join(root,'archive-manifest.json');
 if(fs.existsSync(dest))fail('Refusing to overwrite existing research manifest');
 fs.writeFileSync(dest,JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});
 verifyArchive(manifest,root);
 return manifest;
}
module.exports={stage,write,verifyArchive,digest};
