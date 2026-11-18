'use strict';
// Research-only transport-independent ledger. Never turns an artifact into externally attested evidence.
const crypto=require('node:crypto'),F=require('../forward/forward.cjs'),A=require('../forward/audit.cjs');
const hash=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
function ensure(x,m){if(!x)throw Error(m)}
function append(prev,receipt,sources,runId){
 ensure(typeof runId==='string'&&/^[0-9]{8,16}$/.test(runId),'Invalid source run');
 const audit=A.audit(receipt,sources);
 ensure(String(receipt.run_id)===runId,'Source run mismatch');
 ensure(prev===null||prev?.schema==='mahoraga-v104-ledger-v1','Untrusted predecessor');
 ensure(prev===null||prev?.entries?.every((e,i)=>e.index===i&&
   e.previous_sha256===(i?prev.entries[i-1].sha256:null)&&
   e.sha256===hash(Object.fromEntries(Object.entries(e).filter(([k])=>k!=='sha256')))),
   'Broken predecessor chain');
 ensure(!prev?.entries?.some(e=>e.run_id===runId),'Duplicate capture run');
 const entries=prev?prev.entries.slice():[];
 const entry={index:entries.length,run_id:runId,previous_sha256:entries.length?entries.at(-1).sha256:null,
  receipt_sha256:hash(JSON.stringify(receipt,null,2)+'\n'),source_bundle_sha256:hash(JSON.stringify(sources)),
  observation_ids:receipt.observations.map(x=>x.id),gap_markets:receipt.gaps.map(x=>x.market),
  observations:audit.observations,missing:audit.source_gaps,registration_sha256:receipt.registration_sha256,
  independent_external_attestation:false,approved_for_live:false};
 entry.sha256=hash(entry);entries.push(entry);
 return {schema:'mahoraga-v104-ledger-v1',entries,head_sha256:entry.sha256,
   externally_immutable:false,profitability_verified:false,approved_for_live:false};
}
function verify(ledger){
 ensure(ledger?.schema==='mahoraga-v104-ledger-v1'&&Array.isArray(ledger.entries),'Invalid ledger');
 ledger.entries.forEach((e,i)=>{
  ensure(e.index===i&&e.previous_sha256===(i?ledger.entries[i-1].sha256:null),'Broken chain');
  const {sha256,...body}=e;ensure(sha256===hash(body),'Tampered ledger');
  ensure(e.approved_for_live===false&&e.independent_external_attestation===false,'Promotion');
 });
 ensure(ledger.head_sha256===(ledger.entries.at(-1)?.sha256||null),'Invalid head');
 ensure(ledger.approved_for_live===false&&ledger.profitability_verified===false,'Unsafe ledger');
 return true;
}
module.exports={append,verify,hash};
