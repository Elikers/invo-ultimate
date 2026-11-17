const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),B=require('./backup-manifest.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'invo-backup-'));
try{
 for(const file of B.FILES){
  fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});
  fs.writeFileSync(path.join(root,file),'{"sample":"'+file+'"}\n');
 }
 const file='research/archive/daily/2026-11-18.json';
 fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});
 fs.writeFileSync(path.join(root,file),'{"schema":"invo-v6.7-daily-snapshot-1"}\n');
 const m=B.generate(root);
 assert.equal(m.records.length,B.FILES.length+1);
 assert.equal(B.verify(root,m).verified_files,m.records.length);
 fs.appendFileSync(path.join(root,'research/forward-journal.json'),'damaged');
 assert.throws(()=>B.verify(root,m),/Corrupt/);
 fs.writeFileSync(path.join(root,'research/forward-journal.json'),'{"sample":"research/forward-journal.json"}\n');
 assert.equal(B.verify(root,m).verified_files,m.records.length);
 assert.throws(()=>B.verify(root,{schema:'other'}),/Invalid/);
 const bad={...m,records:[...m.records,{file:'../secret',sha256:'abc',size_bytes:3}]};
 assert.throws(()=>B.verify(root,bad),/Unexpected/);
 const missing={...m,records:m.records.filter(x=>x.file!=='research/latest.json')};
 assert.throws(()=>B.verify(root,missing),/Incomplete/);
}finally{fs.rmSync(root,{recursive:true,force:true});}
console.log('INVO backup integrity, recovery and tamper tests passed');
