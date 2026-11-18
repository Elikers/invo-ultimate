'use strict';const assert=require('node:assert/strict'),fs=require('node:fs'),
 os=require('node:os'),path=require('node:path'),A=require('./archive.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'mahoraga-archive-'));
try{
 const src=path.join(root,'source'),dst=path.join(root,'copy');
 fs.mkdirSync(src);
 for(const name of ['raw.jsonl','events.jsonl','health.jsonl'])fs.writeFileSync(path.join(src,name),JSON.stringify({a:1})+'\n');
 const m=A.stageCopy(src,dst);
 assert.equal(m.externally_durable,false);
 assert.deepEqual(A.verify(dst).files,m.files);
 assert.throws(()=>A.stageCopy(src,dst),/Destination/);
 fs.appendFileSync(path.join(src,'events.jsonl'),'{partial');
 assert.throws(()=>A.verify(src),/Truncated/);
 assert.equal(A.health({last_frame_ms:100,now_ms:15000,disconnections:1,quarantined:1,backup_age_ms:5000000,
 storage_bytes:600000000}).status,'BLOCKED');
}finally{fs.rmSync(root,{recursive:true,force:true});}
console.log('MAHORAGA 01-02 archive digest, non-overwrite copy, outage/backups health PASS');
