'use strict';
// Budget is a conservative REQUEST gate, not a substitute for Google's billing caps.
// Append-only ledger on a persistent runner is required for a cross-run budget; GitHub ephemeral
// jobs are MOCK-only until a separately approved persistent counter is available.
const LIMITS=Object.freeze({max_requests_per_run:1,max_input_characters:9000,
 max_output_tokens:1024,max_estimated_input_tokens:3000,
 max_daily_requests:3,max_monthly_estimated_usd:0.25,
 timeout_ms:20000});
function fail(m){throw Error(m)}
function reserve(ledger,request,now,costs){
 if(!Array.isArray(ledger)||!Number.isSafeInteger(now)||!request||
  request.schema!=='mahoraga-gemini-peer-request-v1')fail('Invalid budget input');
 if(!costs||![costs.usd_per_million_input_tokens,costs.usd_per_million_output_tokens]
    .every(x=>Number.isFinite(x)&&x>=0))fail('Explicit provider price assumptions required');
 const date=new Date(now),month=date.toISOString().slice(0,7),day=date.toISOString().slice(0,10);
 const text=JSON.stringify(request);
 if(text.length>LIMITS.max_input_characters+2200)fail('Prompt size limit');
 const inputTokens=Math.ceil(text.length/3); // conservative heuristic, NOT actual token count
 if(inputTokens>LIMITS.max_estimated_input_tokens)fail('Input token estimate budget');
 const expected=(inputTokens*costs.usd_per_million_input_tokens+
   LIMITS.max_output_tokens*costs.usd_per_million_output_tokens)/1e6;
 const relevant=ledger.filter(x=>x.month===month);
 if(ledger.some(x=>x.request_sha256===request.request_sha256))fail('Duplicate request (no second spend)');
 if(relevant.filter(x=>x.day===day).length>=LIMITS.max_daily_requests)
   fail('Daily API request count cap');
 const total=relevant.reduce((s,x)=>{
  if(!Number.isFinite(x.reserved_usd)||x.reserved_usd<0)fail('Corrupt budget ledger');
  return s+x.reserved_usd;
 },0);
 if(total+expected>LIMITS.max_monthly_estimated_usd)
   fail('Estimated monthly dollar budget exceeded');
 return {record:{schema:'mahoraga-gemini-spend-reservation-v1',
   day,month,request_sha256:request.request_sha256,
   reserved_usd:expected,estimated_input_tokens:inputTokens,
   reserved_output_tokens:LIMITS.max_output_tokens,
   not_actual_billed_cost:true},
  estimated_usd:expected};
}
module.exports={LIMITS,reserve};
