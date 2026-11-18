'use strict';
const assert=require('node:assert/strict');
const C=require('./contracts.cjs'),B=require('./budget.cjs'),P=require('./provider.cjs');
const now=Date.parse('2026-11-18T11:00:00Z');
const request=C.request({task_id:'gemini-test-001',question:'Find causal leakage or unverifiable performance claims in this research module.',
 excerpts:[{path:'research/v10/ops/monitor.cjs',text:"const noLiveOrders = true;\nconst profitVerified = false;"}],now});
assert.equal(C.sha(Object.fromEntries(Object.entries(request).filter(([k])=>k!=='request_sha256'))),request.request_sha256);
assert.equal(P.mockReview(request).verdict,'insufficient_evidence');
assert.equal(P.apiBody(request).generationConfig.responseMimeType,'application/json');
assert.ok(P.prompt(request).includes('UNTRUSTED DATA'));
assert.throws(()=>C.request({task_id:'gemini-test-002',question:'Please review safely',excerpts:[
 {path:'src/trading.js',text:'buy(1)'}]}),/curated/);
assert.throws(()=>C.request({task_id:'gemini-test-003',question:'Please review safely',excerpts:[
 {path:'research/v10/ops/monitor.cjs',text:"const api_key='AIza"+'a'.repeat(30)+"';"}]}),/credentials/);
const invalid={schema:'mahoraga-gemini-peer-review-v1',task_id:request.task_id,
 request_sha256:request.request_sha256,verdict:'needs_changes',summary:'Risk of false performance claims',
 findings:[{severity:'high',title:'Fake strategy improvement',path:'research/v10/ops/monitor.cjs',
 evidence:'Reported paper net profit as realized gain',suggested_test:'Ensure account fills and fees are verified'}],
 trading_authorized:false,model_promoted:false,profitability_verified:false};
assert.equal(C.validate(invalid,request).findings.length,1);
assert.throws(()=>C.validate({...invalid,trading_authorized:true},request),/Unsafe/);
assert.throws(()=>C.validate({...invalid,findings:[{...invalid.findings[0],path:'production/orders.js'}]},request),/ungrounded/);
const cost={usd_per_million_input_tokens:1,usd_per_million_output_tokens:4};
const b=B.reserve([],request,now,cost);assert.ok(b.estimated_usd>0);
assert.throws(()=>B.reserve([b.record],request,now,cost),/Duplicate/);
assert.throws(()=>B.reserve([],request,now,{usd_per_million_input_tokens:-1,usd_per_million_output_tokens:2}),/price/);
(async()=>{
 let calls=0;
 const transport=async (url,opts)=>{calls++;assert.ok(url.startsWith('https://generativelanguage.googleapis.com/v1beta/models/'));
 assert.ok(opts.headers['x-goog-api-key'].length>20);
 return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(invalid)}]}}]})};
 };
 const noKey=await P.review(request,{transport});
 assert.equal(noKey.mode,'OFFLINE_MOCK');assert.equal(noKey.actual_api_calls,0);assert.equal(calls,0);
 await assert.rejects(P.review(request,{mode:'live',transport,model:'gemini-2.5-flash',apiKey:'x'.repeat(25)}),/explicitly enabled/);
 assert.equal(calls,0);
 const allowed=await P.review(request,{mode:'live',liveEnabled:true,persistentBudgetVerified:true,
  model:'gemini-2.5-flash',apiKey:'x'.repeat(25),ledger:[],priceAssumptions:cost,now,transport});
 assert.equal(calls,1);assert.equal(allowed.review.verdict,'needs_changes');
 assert.equal(allowed.approved_for_live,false);
 assert.equal(allowed.actual_billed_usd,null);
 await assert.rejects(P.review(request,{mode:'live',liveEnabled:true,persistentBudgetVerified:true,
  model:'gemini-2.5-flash',apiKey:'x'.repeat(25),ledger:[],priceAssumptions:cost,now,
  transport:async()=>({ok:true,json:async()=>({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:JSON.stringify(invalid)}]}}]})})}),/incomplete/);
 console.log('MAHORAGA Gemini no-key mock, output contract, no-network default, opt-in, budget and untrusted findings PASS');
})().catch(e=>{console.error(e);process.exitCode=1});
