'use strict';
// Local durable research journal for approved filesystems. No cloud storage or background daemon.
// Append+fsync; on restart any malformed/truncated line or hash chain fails closed.
const fs=require('node:fs'),path=require('node:path'),F=require('./feedback.cjs');
function read(file){
 if(!fs.existsSync(file))return [];
 const bytes=fs.readFileSync(file,'utf8');
 if(bytes.length===0)return [];
 if(!bytes.endsWith('\n'))throw Error('Incomplete journal tail: manual quarantine required');
 const rows=bytes.trimEnd().split('\n').map((line,i)=>{
  try{return JSON.parse(line);}catch{throw Error('Malformed journal record line '+(i+1));}
 });
 F.verify(rows);return rows;
}
function append(file,item){
 if(typeof file!=='string'||!file.endsWith('.jsonl'))throw Error('Journal extension required');
 fs.mkdirSync(path.dirname(file),{recursive:true});
 const previous=read(file);
 const next=F.add(previous,item),entry=next.at(-1);
 const fd=fs.openSync(file,'a',0o600);
 try{fs.writeSync(fd,JSON.stringify(entry)+'\n');fs.fsyncSync(fd);}
 finally{fs.closeSync(fd);}
 // Verify persistence before returning acceptance.
 const persisted=read(file);
 if(persisted.length!==next.length||persisted.at(-1).hash!==entry.hash)
 throw Error('Persisted hash-chain verification failed');
 return {entries:persisted.length,latest_hash:entry.hash,ready_for_training:false};
}
module.exports={read,append};
