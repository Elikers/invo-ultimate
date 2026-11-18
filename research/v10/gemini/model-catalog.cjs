#!/usr/bin/env node
'use strict';
// Read-only Google Gemini model catalog diagnostic. No generation / paid model inference.
// Never print or persist the key, response body or private Google project details.
const fs=require('node:fs');
const URL='https://generativelanguage.googleapis.com/v1beta/models?pageSize=100';
async function probe({key,transport=globalThis.fetch,out='/tmp/mahoraga-gemini-model-catalog-audit.json'}={}){
 if(typeof key!=='string'||key.length<20)throw Error('Gemini API credential missing (not printed)');
 if(!out.startsWith('/tmp/mahoraga-gemini-'))throw Error('Invalid audit location');
 const timeout=AbortSignal.timeout(15000);
 let response,body;
 try {response=await transport(URL,{method:'GET',headers:{'x-goog-api-key':key},signal:timeout});}
 catch {response=null;}
 const audit={schema:'mahoraga-gemini-readonly-model-catalog-v1',
   endpoint:'GET /v1beta/models',http_status:Number.isSafeInteger(response?.status)?response.status:null,
   authenticated_catalog_available:response?.ok===true,
   candidate_model_names:[],generate_content_methods_advertised:false,
   real_generate_content_eligibility_verified:false,
   inference_calls:0,actual_billed_usd:null,no_live_trading:true,approved_for_live:false};
 if(response?.ok===true){
   try{
    body=await response.json();
    if(!Array.isArray(body.models))throw Error('Invalid models listing');
    audit.candidate_model_names=body.models.filter(m=>
      typeof m.name==='string'&&/^models\/gemini-[a-z0-9.-]{3,80}$/.test(m.name)&&
      Array.isArray(m.supportedGenerationMethods)&&m.supportedGenerationMethods.includes('generateContent'))
      .map(m=>m.name).slice(0,40);
    audit.generate_content_methods_advertised=audit.candidate_model_names.length>0;
   }catch{audit.authenticated_catalog_available=false;}
 }
 fs.writeFileSync(out,JSON.stringify(audit,null,2)+'\n',{mode:0o600,flag:'wx'});
 return audit;
}
if(require.main===module)probe({key:process.env.GEMINI_API_KEY}).then(x=>{
 console.log(JSON.stringify({http_status:x.http_status,authenticated_catalog_available:x.authenticated_catalog_available,
   candidate_models:x.candidate_model_names,inference_calls:0,real_generation_verified:false}));
 if(!x.authenticated_catalog_available)process.exitCode=2;
}).catch(()=>{console.error('Model catalog diagnostic failed safely without printing secrets');process.exitCode=2;});
module.exports={probe,URL};
