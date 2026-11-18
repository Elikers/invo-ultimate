'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{probe}=require('./model-catalog.cjs');
(async()=>{
 let count=0;const filename='/tmp/mahoraga-gemini-catalog-test-'+process.pid+'.json';
 const res=await probe({key:'mock_key_1234567890123456',out:filename,transport:async(url,args)=>{
 count++;assert.equal(args.method,'GET');assert.ok(!args.body);
 assert.ok(args.headers['x-goog-api-key'].startsWith('mock_key_'));
 return {ok:true,status:200,json:async()=>({models:[
 {name:'models/gemini-3.8-flash',supportedGenerationMethods:['generateContent']},
 {name:'models/gemini-2.5-flash-lite',supportedGenerationMethods:['countTokens']}
 ]})};}});
 assert.equal(count,1);assert.equal(res.authenticated_catalog_available,true);
 assert.deepEqual(res.candidate_model_names,['models/gemini-3.8-flash']);
 assert.equal(res.real_generate_content_eligibility_verified,false);
 assert.equal(res.inference_calls,0);
 assert.ok(!fs.readFileSync(filename,'utf8').includes('mock_key_'));
 fs.rmSync(filename,{force:true});
 const f2='/tmp/mahoraga-gemini-catalog-403-'+process.pid+'.json';
 const denied=await probe({key:'mock_key_1234567890123456',out:f2,
  transport:async()=>({ok:false,status:403})});
 assert.equal(denied.authenticated_catalog_available,false);
 assert.equal(denied.http_status,403);
 fs.rmSync(f2,{force:true});
 console.log('MAHORAGA Gemini read-only catalog mock: no inference, no credentials in audit, model method filtering PASS');
})().catch(e=>{console.error(e);process.exitCode=1});
