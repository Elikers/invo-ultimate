'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {build,execute,PRICE}=require('./one-shot.cjs');
(async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'mahoraga-gemini-shot-'));
 try{
  const x=build();assert.ok(x.reserved<=PRICE.max_reserved_usd);
  assert.ok(x.prompt.length<=PRICE.max_input_chars);
  await assert.rejects(
   execute({apiKey:'fake_test_key_012345678901234',outputFile:'/not-allowed.json',
     transport:async()=>{throw Error('must not be called')}}),
   /Only a private temporary audit destination/);
 }catch(e){throw e}
 // One fake HTTP attempt only; never print the secret or raw response.
 const f='/tmp/mahoraga-gemini-test-'+process.pid+'-'+Date.now()+'.json';
 const r=await execute({apiKey:'safe_fake_key_1234567890',outputFile:f,
  transport:async(url,options)=>{
   assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent');
   assert.equal(options.headers['x-goog-api-key'],'safe_fake_key_1234567890');
   const req=build().req;
   return {ok:true,status:200,json:async()=>({candidates:[{finishReason:'STOP',
    content:{parts:[{text:JSON.stringify({
     schema:'mahoraga-gemini-peer-review-v1',task_id:req.task_id,request_sha256:req.request_sha256,
     verdict:'insufficient_evidence',summary:'Paper quote excludes actual fills and funding; research limitations remain.',
     findings:[],trading_authorized:false,model_promoted:false,profitability_verified:false
    })}]}}],usageMetadata:{promptTokenCount:280,candidatesTokenCount:82}})}
  }});
 assert.equal(r.api_response_ok,true);assert.equal(r.provider_review_contract_valid,true);
 assert.equal(r.live_orders,false);assert.equal(r.actual_billed_usd,null);
 const file=fs.readFileSync(f,'utf8');assert.ok(!file.includes('safe_fake_key'));
 fs.rmSync(f,{force:true});
 let attempted=0;
 const f2='/tmp/mahoraga-gemini-test-missing-'+process.pid+'.json';
 const rejected=await execute({apiKey:'safe_fake_key_1234567890',outputFile:f2,
  transport:async()=>{attempted++;return {ok:false,status:403}}});
 assert.equal(attempted,1);assert.equal(rejected.api_status,403);
 assert.equal(rejected.provider_review_contract_valid,false);
 fs.rmSync(f2,{force:true});
 await assert.rejects(execute({apiKey:'',outputFile:'/tmp/mahoraga-gemini-block.json',transport:async()=>{throw Error('must not happen')}}),/unavailable/);
 fs.rmSync(temp,{recursive:true,force:true});
 console.log('MAHORAGA Gemini single-use mock transport, no-secret audit, exact-one request, failure classification PASS');
})().catch(e=>{console.error(e);process.exitCode=1});
