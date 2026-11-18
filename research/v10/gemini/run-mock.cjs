#!/usr/bin/env node
'use strict';
// Safe GitHub Actions entrypoint: mock mode hard-coded, zero secrets or network requests.
const fs=require('node:fs'),path=require('node:path');
const C=require('./contracts.cjs'),P=require('./provider.cjs'),B=require('./budget.cjs');
async function main(){
 const out=path.resolve(process.env.MAHORAGA_GEMINI_MOCK_OUT||'/tmp/mahoraga-gemini-mock');
 fs.mkdirSync(out,{recursive:true,mode:0o700});
 const source=[
  '// PUBLIC NON-EXECUTABLE CODE REVIEW FIXTURE',
  'function paperNet(referenceGross, assumedFee){ return referenceGross-assumedFee; }',
  '// Warning: funding and actual venue fills are not represented in this fixture.'
 ].join('\n');
 const req=C.request({task_id:'mahoraga-peer-mock-001',
  question:'Identify missing evidence requirements for a research-only quote-referenced paper profit calculation.',
  excerpts:[{path:'research/v10/gemini/mock-fixture.cjs',text:source}]});
 const result=await P.review(req,{mode:'mock'});
 const audit={schema:'mahoraga-gemini-mock-audit-v1',request_sha256:req.request_sha256,
  mode:result.mode,review:result.review,
  provider_calls:result.actual_api_calls,actual_api_cost_usd:result.actual_billed_usd,
  theoretical_live_limits:B.LIMITS,independent_external_review_performed:false,
  training_eligible:false,production_changed:false,approved_for_live:false};
 fs.writeFileSync(path.join(out,'mock-peer-review.json'),JSON.stringify(audit,null,2)+'\n',{mode:0o600,flag:'wx'});
 console.log(JSON.stringify({mode:audit.mode,provider_calls:0,external_review:false,
  approved_for_live:false,request_sha256:req.request_sha256}));
}
main().catch(e=>{console.error('Mock adapter failed: '+e.message);process.exitCode=1});
