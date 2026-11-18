#!/usr/bin/env node
'use strict';
// Persist only a real, independently audited v10.3 capture bundle from the current Actions run.
// This script does not fetch, fill, reconstruct or synthesize any market observation.
const fs=require('node:fs'),path=require('node:path');
const L=require('./ledger.cjs'),F=require('../forward/forward.cjs');
function persist(inputDir,root,runId){
 if(!/^[0-9]{8,16}$/.test(String(runId)))throw Error('Bad run ID');
 const bytes=fs.readFileSync(path.join(inputDir,'capture-receipt.json'),'utf8');
 const receipt=JSON.parse(bytes);
 const sha=fs.readFileSync(path.join(inputDir,'capture-receipt.sha256'),'utf8').trim().split(/\s+/)[0];
 if(sha!==F.hash(bytes))throw Error('Capture receipt digest mismatch');
 const sourceBytes=fs.readFileSync(path.join(inputDir,'selected-public-frames.json'),'utf8');
 const sources=JSON.parse(sourceBytes);
 const previousFile=path.join(root,'ledger.json');
 const previous=fs.existsSync(previousFile)?JSON.parse(fs.readFileSync(previousFile,'utf8')):null;
 if(previous)L.verify(previous);
 const next=L.append(previous,receipt,sources,String(runId));
 const runDir=path.join(root,'runs',String(runId));
 if(fs.existsSync(runDir))throw Error('Receipt directory already exists');
 fs.mkdirSync(runDir,{recursive:true,mode:0o700});
 fs.writeFileSync(path.join(runDir,'capture-receipt.json'),bytes);
 fs.writeFileSync(path.join(runDir,'capture-receipt.sha256'),sha+'  capture-receipt.json\n');
 fs.writeFileSync(path.join(runDir,'selected-public-frames.json'),sourceBytes);
 fs.writeFileSync(previousFile,JSON.stringify(next,null,2)+'\n');
 return {run_id:String(runId),entries:next.entries.length,head_sha256:next.head_sha256,
  observations:receipt.observations.length,gaps:receipt.gaps.length,approved_for_live:false};
}
if(require.main===module){
 const [input,root,run]=process.argv.slice(2);
 if(!input||!root||!run)throw Error('Usage: persist.cjs <capture-dir> <ledger-dir> <run-id>');
 console.log(JSON.stringify(persist(path.resolve(input),path.resolve(root),run)));
}
module.exports={persist};
