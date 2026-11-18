'use strict';
const assert=require('node:assert/strict');
const F=require('../forward/forward.cjs'),R=require('../forward/registration.json'),M=require('../ops/maturity.cjs');
const moment=F.START+10000;
function raw(){
 const bids=Array.from({length:10},(_,i)=>({px:String(100-i/10),sz:'5'}));
 const asks=Array.from({length:10},(_,i)=>({px:String(100.01+i/10),sz:'1'}));
 return JSON.stringify({channel:'l2Book',data:{coin:'BTC',time:moment,levels:[bids,asks]}});
}
const entry=raw(),obs=F.propose(entry,moment,moment);
assert.equal(obs.side,'LONG');
const receipt={schema:'mahoraga-v103-capture-receipt-v1',run_id:'12345678',
 registration_sha256:F.hash(R),live_orders:false,training_eligible:false,
 independent_external_attestation:false,observations:[obs],
 gaps:R.markets.filter(x=>x!==obs.market).map(x=>F.gap(x,moment,'RESEARCH_GAP'))};
const frames={BTC:{raw:entry,received_at_ms:moment,source_sha256:F.hash(entry)}};
const state=M.init(receipt,frames),at=obs.mature_after_ms+R.exit_tolerance_ms+1;
const forged={...F.mature(obs,null,null,at),status:'PAPER_OUTCOME_WITH_FUNDING_UNKNOWN',
 paper_net_including_funding:null,paper_net_ex_funding:123,
 source_exit_sha256:'a'.repeat(64)};
state.labels.set(obs.id,forged); // MATCHING observation ID, not unrelated 'forged_id'!
const final=M.finalize(state,at,'ADVERSARIAL_RESEARCH_DIAGNOSTIC');
assert.equal(final.result.outcomes[0].status,'PAPER_OUTCOME_WITH_FUNDING_UNKNOWN');
assert.equal(final.result.outcomes[0].paper_net_ex_funding,123);
assert.equal(Object.keys(final.result.exitSources).length,0);
assert.equal(final.audit.matched_labels,1);
console.log('CONFIRMED RESEARCH INTEGRITY GAP: existing observation ID accepts forged quote-free paper label through basic auditor. Not proof of real market exploit.');
