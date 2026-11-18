'use strict';const assert=require('node:assert/strict'),L=require('./feedback.cjs');
const t=Date.parse('2026-11-19T00:00:00Z');
const d={type:'DECISION',id:'btc-fusion-001',expert:'fusion',side:'LONG',model_sha256:'a'.repeat(64),
 predicted_at_ms:t,feature_available_ms:t,mature_after_ms:t+900000,
 recorded_at_ms:t+500,registration_id:'registered-paper-v10',production_authorized:false};
let ledger=L.add([],d);
assert.equal(L.verify(ledger).verified,true);
assert.throws(()=>L.add(ledger,{...d,id:'btc-fusion-002',recorded_at_ms:t-1}),/chronological/);
assert.throws(()=>L.add(ledger,{...d,id:'btc-fusion-001',recorded_at_ms:t+1000}),/duplicate/);
const outcome={type:'OUTCOME',id:d.id,recorded_at_ms:t+910000,gross_paper_pct:.3,assumed_cost_bps:16,
 paper_exit_rule:'frozen-paper-12-bars',execution_fill_verified:false};
assert.throws(()=>L.add(ledger,{...outcome,recorded_at_ms:t+1000}),/premature/);
ledger=L.add(ledger,outcome);
assert.equal(L.verify(ledger).entries,2);
const rows=L.trainingRows(ledger,t+920000);
assert.equal(rows.length,1);
assert.equal(rows[0].eligible_for_training,false);
assert.ok(Math.abs(rows[0].net_paper_pct-.14)<1e-9);
assert.equal(L.trainingRows(ledger,t+10).length,0);
assert.throws(()=>L.add(ledger,{...outcome,recorded_at_ms:t+930000}),/duplicated/);
const edit=structuredClone(ledger);edit[0].item.side='SHORT';
assert.throws(()=>L.verify(edit),/tampering/);
let abstain=L.add([],{...d,id:'no-trade-001',side:'NONE'});
assert.throws(()=>L.add(abstain,{...outcome,id:'no-trade-001'}),/missing/);
console.log('MAHORAGA F append-only provenance, matured outcomes and tamper detection PASS');
