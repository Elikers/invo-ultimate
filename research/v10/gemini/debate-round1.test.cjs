'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const M=require('./debate-round1.cjs');
(async()=>{
 const p=M.prepare();
 assert.ok(p.estimated<=0.005&&p.instructions.length<=6500);
 assert.equal(p.request.excerpts[0].sha256,require('./contracts.cjs').sha(fs.readFileSync('research/v10/ops/maturity.cjs','utf8')));
 assert.equal(p.request.excerpts[0].path,'research/v10/ops/maturity.cjs');
 let n=0;
 const out='/tmp/mahoraga-gemini-debate-mock-'+process.pid+'.json';
 const result=await M.run({key:'fake_key_12345678901234567890',out,transport:async(url,init)=>{
   n++;assert.ok(url.includes('/models/gemini-3.5-flash-lite:generateContent'));
   assert.equal(init.headers['x-goog-api-key'],'fake_key_12345678901234567890');
   assert.equal(JSON.parse(init.body).generationConfig.maxOutputTokens,900);
   const q=p.request;
   return {ok:true,status:200,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({
    schema:'mahoraga-gemini-peer-review-v1',task_id:q.task_id,request_sha256:q.request_sha256,
    verdict:'insufficient_evidence',summary:'Need actual independent forward evidence to establish causal reliability.',
    findings:[],trading_authorized:false,model_promoted:false,profitability_verified:false})}]}}],
    usageMetadata:{promptTokenCount:1000,candidatesTokenCount:90,totalTokenCount:1090}})};
 }});
 assert.equal(n,1);assert.equal(result.response_schema_valid,true);
 assert.equal(result.review.profitability_verified,false);
 assert.ok(!fs.readFileSync(out,'utf8').includes('fake_key_'));
 await assert.rejects(M.run({key:'fake_key_12345678901234567890',out,
  transport:async()=>{throw Error('Never re-request')} }),/already exists/);
 fs.unlinkSync(out);
 console.log('MAHORAGA multi-model debate: one request, strict causal code fingerprint, bounded tokens, no secrets, replay protection PASS');
})().catch(e=>{console.error(e);process.exitCode=1});
