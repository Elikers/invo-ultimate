'use strict';
// Immutable-by-convention export for independently retained research artifacts.
// A content hash alone cannot prove independent timestamp or prevent wholesale rewriting.
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const supported=['raw.jsonl','events.jsonl','health.jsonl','connection-health.jsonl'];
function verify(dir){
 if(typeof dir!=='string'||!path.isAbsolute(dir))throw Error('Absolute collection directory required');
 const files={};let count=0;
 for(const name of supported){
  const file=path.join(dir,name);if(!fs.existsSync(file))continue;
  const bytes=fs.readFileSync(file),content=bytes.toString('utf8');
  if(content&&!content.endsWith('\n'))throw Error('Truncated capture file: '+name);
  let rows=0;for(const line of content.split('\n'))if(line){JSON.parse(line);rows++}
  files[name]={sha256:sha(bytes),bytes:bytes.length,rows};count++;
 }
 if(count<3||!files['raw.jsonl']||!files['events.jsonl']||!files['health.jsonl'])
 throw Error('Incomplete raw/source/health archive');
 if(files['raw.jsonl'].rows!==files['health.jsonl'].rows)throw Error('Raw frame health count mismatch');
 return {schema:'invo-v10-research-archive-manifest-1',files,
  independently_timestamped:false,externally_durable:false,
  complete_market_feed_verified:false,research_only:true};
}
function stageCopy(source,dest){
 const manifest=verify(source);
 if(!path.isAbsolute(dest)||source===dest)throw Error('Distinct absolute export directory required');
 fs.mkdirSync(dest,{recursive:true,mode:0o700});
 for(const name of Object.keys(manifest.files)){
  const dst=path.join(dest,name);
  if(fs.existsSync(dst))throw Error('Destination must be new, never overwrite artifacts');
  fs.copyFileSync(path.join(source,name),dst,fs.constants.COPYFILE_EXCL);
  if(sha(fs.readFileSync(dst))!==manifest.files[name].sha256)throw Error('Copy hash mismatch');
 }
 const target=path.join(dest,'research-manifest.json');
 fs.writeFileSync(target,JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});
 return manifest;
}
function health({last_frame_ms,now_ms,disconnections,quarantined,backup_age_ms,storage_bytes}){
 if(!Number.isSafeInteger(now_ms)||!Number.isSafeInteger(last_frame_ms)||now_ms<last_frame_ms||
 [disconnections,quarantined,backup_age_ms,storage_bytes].some(x=>!Number.isSafeInteger(x)||x<0))
 throw Error('Invalid health metrics');
 const alerts=[];
 if(now_ms-last_frame_ms>10000)alerts.push('FEED_STALE');
 if(disconnections>0)alerts.push('RECENT_DISCONNECTS');
 if(quarantined>0)alerts.push('QUARANTINED_EVENTS_REQUIRE_REVIEW');
 if(backup_age_ms>3600000)alerts.push('ARCHIVE_BACKUP_LATE');
 if(storage_bytes>5e8)alerts.push('STORAGE_ROTATION_NEEDED');
 return {status:alerts.length?'BLOCKED':'HEALTH_METRICS_ONLY_NOT_CONTINUITY_PROOF',
  alerts,training_approved:false,live_orders:false};
}
module.exports={verify,stageCopy,health};
