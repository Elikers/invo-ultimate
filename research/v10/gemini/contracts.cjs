'use strict';
// Research-only peer-review contract. No trading, finance execution, or code execution.
const crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const SEVERITIES=['critical','high','medium','low','informational'];
const VERDICTS=['needs_changes','insufficient_evidence','no_blocking_issues_found'];
function fail(m){throw Error(m)}
function assert(ok,m){if(!ok)fail(m)}
function request({task_id,question,excerpts,provenance='PUBLIC_RESEARCH_CODE',now=Date.now()}){
 assert(/^[a-zA-Z0-9_-]{8,80}$/.test(task_id||''),'Invalid task id');
 assert(typeof question==='string'&&question.length>=10&&question.length<=1000,'Review question length');
 assert(Array.isArray(excerpts)&&excerpts.length>=1&&excerpts.length<=4,'One to four excerpts');
 let size=question.length;
 const items=excerpts.map(x=>{
  assert(/^[a-z0-9/_.-]{1,150}$/i.test(x.path||'')&&x.path.startsWith('research/v10/'),
   'Only allow curated, public research paths');
  assert(typeof x.text==='string'&&x.text.length>=1&&x.text.length<=4000,
   'Excerpt length');
  // Fail closed on likely credentials or sensitive account material, even when appearing in documentation.
  assert(!/(?:AIza[0-9A-Za-z_-]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|gh[pousr]_[0-9A-Za-z_]{20,}|sk-[0-9A-Za-z_-]{20,}|(?:api[_ -]?key|authorization|bearer|password|private[_ -]?key|secret)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{12,})/i.test(x.text),
    'Possible credentials in externally submitted excerpt');
  size+=x.text.length;
  return {path:x.path,text:x.text,sha256:sha(x.text)};
 });
 assert(size<=9000,'External prompt size budget exceeded');
 assert(provenance==='PUBLIC_RESEARCH_CODE','Unsupported data provenance');
 assert(Number.isSafeInteger(now)&&now>0,'Invalid clock');
 const out={schema:'mahoraga-gemini-peer-request-v1',task_id,created_at_ms:now,
  question,excerpts:items,provenance,research_only:true,
  live_orders_allowed:false,automatic_strategy_promotion:false,
  instructions:'Identify mistakes, causal leakage, unverifiable claims and safety risks. Do not assert realized profit or recommend live trading.'};
 out.request_sha256=sha(out);
 return out;
}
function validate(response,original){
 assert(original?.schema==='mahoraga-gemini-peer-request-v1'&&original.request_sha256===sha(Object.fromEntries(Object.entries(original).filter(([k])=>k!=='request_sha256'))),'Untrusted request');
 assert(response&&typeof response==='object'&&!Array.isArray(response),'Invalid review object');
 assert(response.schema==='mahoraga-gemini-peer-review-v1'&&
   response.task_id===original.task_id&&response.request_sha256===original.request_sha256&&
   VERDICTS.includes(response.verdict)&&typeof response.summary==='string'&&
   response.summary.length>=5&&response.summary.length<=2500,'Invalid review header');
 assert(Array.isArray(response.findings)&&response.findings.length<=12,'Too many findings');
 for(const f of response.findings){
  assert(f&&SEVERITIES.includes(f.severity)&&typeof f.title==='string'&&f.title.length>=4&&f.title.length<=160&&
   typeof f.evidence==='string'&&f.evidence.length>=5&&f.evidence.length<=1200&&
   typeof f.suggested_test==='string'&&f.suggested_test.length>=5&&f.suggested_test.length<=1200&&
   original.excerpts.some(x=>x.path===f.path),'Invalid or ungrounded finding');
 }
 assert(response.trading_authorized===false&&response.model_promoted===false&&
    response.profitability_verified===false,'Unsafe external review claims');
 return {schema:response.schema,task_id:response.task_id,request_sha256:response.request_sha256,
  verdict:response.verdict,summary:response.summary,findings:response.findings.map(f=>({
   severity:f.severity,title:f.title,path:f.path,evidence:f.evidence,suggested_test:f.suggested_test
  })),trading_authorized:false,model_promoted:false,profitability_verified:false,
  treated_as_untrusted_advice:true};
}
module.exports={request,validate,sha,SEVERITIES,VERDICTS};
