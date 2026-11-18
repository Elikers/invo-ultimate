#!/usr/bin/env node
'use strict';
// Consumes a prior GitHub Actions research receipt. Only runs AFTER original horizon.
// A fresh public quote must arrive within the registered exit tolerance. No backfill.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const F=require('./forward.cjs'),R=require('./registration.json');
const dir=path.resolve(process.env.MAHORAGA_PREVIOUS_CAPTURE||'/tmp/mahoraga-forward-prior');
const out=path.resolve(process.env.MAHORAGA_FORWARD_OUT||'/tmp/mahoraga-forward-outcomes');
const read=x=>fs.readFileSync(path.join(dir,x),'utf8');
const receiptBytes=read('capture-receipt.json');
const [digest]=read('capture-receipt.sha256').trim().split(/\s+/);
if(digest!==F.hash(receiptBytes))throw Error('Prior receipt SHA256 mismatched');
const receipt=JSON.parse(receiptBytes),sources=JSON.parse(read('selected-public-frames.json'));
if(receipt.schema!=='mahoraga-v103-capture-receipt-v1'||
   receipt.registration_sha256!==F.hash(R)||
   receipt.independent_external_attestation!==false||
   receipt.live_orders!==false||
   !Array.isArray(receipt.observations))throw Error('Untrusted prior receipt');
for(const o of receipt.observations){
 F.verifyObservation(o);
 const item=sources[o.market];
 if(!item||item.source_sha256!==F.hash(item.raw)||
    item.received_at_ms!==o.received_at_ms||item.source_sha256!==o.source_raw_sha256)
   throw Error('Missing original publisher source payload');
 const recreated=F.propose(item.raw,item.received_at_ms,o.decision_time_ms);
 if(JSON.stringify(recreated)!==JSON.stringify(o))throw Error('Recomputed pre-outcome decision differs');
}
if(!receipt.observations.length){
 fs.mkdirSync(out,{recursive:true});
 const r={status:'NO_REGISTERED_PREDICTIONS_TO_EVALUATE',outcomes:[],profitability_verified:false,approved_for_live:false};
 fs.writeFileSync(path.join(out,'outcomes.json'),JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify(r));process.exit(0);
}
const now=Date.now();
if(receipt.observations.some(o=>now<o.mature_after_ms))
 throw Error('Premature outcome evaluation prohibited: observe after the full horizon');
fs.mkdirSync(out,{recursive:true,mode:0o700});
const outcomes=[],exitSources={};
for(const o of receipt.observations)if(o.side==='NONE')
 outcomes.push(F.mature(o,null,null,now));
const pending=new Set(receipt.observations.filter(o=>o.side!=='NONE').map(o=>o.market));
let done=false,count=0;
const ws=new WebSocket('wss://api.hyperliquid.xyz/ws');
function finish(reason){
 if(done)return;done=true;clearTimeout(timeout);
 try{ws.close()}catch{}
 const ended=Date.now();
 for(const o of receipt.observations){
  if(outcomes.some(x=>x.observation_id===o.id))continue;
  outcomes.push(F.mature(o,null,null,ended));
 }
 const res={schema:'mahoraga-v103-paper-outcome-receipt-v1',source_capture_run_id:receipt.run_id,
   outcome_capture_run_id:process.env.GITHUB_RUN_ID||null,reason,
   created_at_ms:ended,source_receipt_sha256:F.hash(receiptBytes),
   outcomes,exitSources,forward_paper_results:outcomes.filter(x=>x.status==='PAPER_OUTCOME_WITH_FUNDING_UNKNOWN').length,
   independent_external_attestation:false,portfolio_profitability_verified:false,
   training_eligible:false,approved_for_live:false,no_live_orders:true};
 fs.writeFileSync(path.join(out,'outcomes.json'),JSON.stringify(res,null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify({reason,results:outcomes.map(x=>({market:x.market,status:x.status,
   paper_net_ex_funding:x.paper_net_ex_funding??null})),live_orders:false,profit_verified:false}));
}
const timeout=setTimeout(()=>finish('BOUNDED_MATURITY_WINDOW'),15000);
ws.addEventListener('open',()=>{
 for(const market of pending)
  ws.send(JSON.stringify({method:'subscribe',subscription:{type:'l2Book',coin:market}}));
 if(!pending.size)finish('ALL_NO_TRADE');
});
ws.addEventListener('message',event=>{
 if(done)return;
 const raw=String(event.data),at=Date.now();let j;
 try{j=JSON.parse(raw)}catch{return}
 if(j.channel!=='l2Book'||!pending.has(j.data?.coin))return;
 for(const o of receipt.observations.filter(o=>o.market===j.data.coin)){
  if(at<o.mature_after_ms)continue;
  const label=F.mature(o,raw,at,Date.now());
  if(label.status==='PAPER_OUTCOME_WITH_FUNDING_UNKNOWN'){
   outcomes.push(label);
   exitSources[o.market]={raw,received_at_ms:at,source_sha256:F.hash(raw)};
   pending.delete(o.market);
  }else if(at>o.mature_after_ms+R.exit_tolerance_ms){
   outcomes.push(label);pending.delete(o.market);
  }
 }
 if(!pending.size)finish('ALL_MARKETS_MATURED');
});
ws.addEventListener('error',()=>finish('PUBLIC_WS_ERROR'));
ws.addEventListener('close',()=>finish('PUBLIC_WS_DISCONNECTED'));
