'use strict';const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),B=require('./batch.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'mahoraga-all8-'));
try{
 const r=B.run({root,journalByExpert:{},labelsByExpert:{},nowMs:Date.parse('2026-11-19T00:00:00Z'),dryRun:true});
 assert.equal(Object.keys(r.experts).length,8);
 assert.equal(r.updates,0);assert.equal(r.all_eight_inputs_available,false);
 assert.equal(r.orders_enabled,false);
 assert.throws(()=>B.run({root,journalByExpert:{},labelsByExpert:{},dryRun:false}),/dry-run/);
 assert.equal(fs.readdirSync(root).length,0); // missing sources do not create fake state
}finally{fs.rmSync(root,{recursive:true,force:true});}
console.log('MAHORAGA 09 gated eight-expert research batch, missing input abstention and no account changes PASS');
