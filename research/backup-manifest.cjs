/* INVO recovery manifest v1: SHA-256 manifest for read-only research artifacts.
 * Note: checksums detect accidental corruption; they are not signatures or off-site backups.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const FILES=[
 'research/latest.json','research/loss-diagnosis.json',
 'research/market-intelligence.json','research/integrity-risk.json',
 'research/forward-summary.json','research/forward-journal.json',
 'research/collector-health.json','research/operations-health.json',
 'research/archive/forward-events.jsonl'
];
const OPTIONAL=['research/forward-intelligence.json','research/journal-quality.json','research/collector-coverage.json'];
const DAILY=/^research\/archive\/daily\/\d{4}-\d{2}-\d{2}\.json$/;
function files(root){
 const list=[...FILES,...OPTIONAL.filter(file=>fs.existsSync(path.join(root,file)))],daily=path.join(root,'research/archive/daily');
 if(fs.existsSync(daily))for(const file of fs.readdirSync(daily)){
  const rel='research/archive/daily/'+file;
  if(!DAILY.test(rel))throw Error('Unexpected daily filename '+rel);
  list.push(rel);
 }
 return list.sort();
}
function digest(bytes){return crypto.createHash('sha256').update(bytes).digest('hex');}
function generate(root){
 const records=files(root).map(file=>{
  const abs=path.join(root,file);
  if(!fs.existsSync(abs))throw Error('Required backup file missing '+file);
  const content=fs.readFileSync(abs);
  if(!content.length)throw Error('Empty backup file '+file);
  return {file,size_bytes:content.length,sha256:digest(content)};
 });
 return {schema:'invo-backup-manifest-v1',created_utc:new Date().toISOString(),
  hash:'sha256',records,
  warnings:['Checksums detect changes but do not authenticate an attacker-controlled archive.','GitHub Actions artifacts are not independent off-site backups.','Forward journal contains simulated paper observations only.']};
}
function verify(root,manifest){
 if(manifest?.schema!=='invo-backup-manifest-v1'||!Array.isArray(manifest.records)||!manifest.records.length)throw Error('Invalid backup manifest');
 const seen=new Set();
 for(const item of manifest.records){
  if(!FILES.includes(item.file)&&!OPTIONAL.includes(item.file)&&!DAILY.test(item.file))throw Error('Unexpected backup path');
  if(seen.has(item.file))throw Error('Repeated manifest path');
  seen.add(item.file);
  const full=path.join(root,item.file);
  if(!fs.existsSync(full))throw Error('Missing backup file '+item.file);
  const contents=fs.readFileSync(full);
  if(contents.length!==item.size_bytes||digest(contents)!==item.sha256)throw Error('Corrupt backup file '+item.file);
 }
 for(const file of FILES)if(!seen.has(file))throw Error('Incomplete manifest missing '+file);
 return {verified_files:seen.size,verified_bytes:manifest.records.reduce((s,r)=>s+r.size_bytes,0)};
}
function save(root){
 const file=path.join(root,'research','backup-manifest.json');
 const manifest=generate(root);
 fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');
 const result=verify(root,manifest);
 console.log('INVO research backup verified',JSON.stringify(result));
 return result;
}
if(require.main===module){
 try{
  if(process.argv[2]==='--verify'){
   const root=path.resolve(process.argv[3]||path.resolve(__dirname,'..'));
   const data=JSON.parse(fs.readFileSync(path.join(root,'research/backup-manifest.json'),'utf8'));
   console.log('RESTORED BACKUP VERIFIED',JSON.stringify(verify(root,data)));
  }else save(path.resolve(__dirname,'..'));
 }
 catch(err){console.error('BACKUP CHECK FAILED',err.message);process.exitCode=1}
}
module.exports={FILES,generate,verify,save};
