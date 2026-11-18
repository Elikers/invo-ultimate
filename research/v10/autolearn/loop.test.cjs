'use strict';
const assert=require('node:assert/strict');
const S=require('../shadow/shadow.cjs'),R=require('../shadow/registration.json');
const A=require('./loop.cjs'),M=require('../learners/specialists.cjs');
const base=Date.parse('2026-11-20T00:00:00Z'),registrationSha=S.hash(R);
const values={trend:1,volatility:.7,volume_ratio:2,spread_bps:4,
 order_imbalance:.25,funding:.0001,open_interest_change:.1};
const full={values,observed:Object.keys(values)};
function fixture(n=35){
 const m=A.init('fusion'),version=M.fingerprint(m.champion);
 let journal=[],rows=[];
 for(let i=0;i<n;i++){
  const time=base+i*7200000;
  const features=structuredClone(full);
  const obs={type:'OBSERVATION',id:'BTC-FUSION-OBS-'+i,market:'BTC',venue:R.venue,
   predicted_at_ms:time,captured_at_ms:time+10,available_to_model_ms:time-20,
   mature_after_ms:time+3600000,input_sha256:'c'.repeat(64),
   registration_sha256:registrationSha,decisions:[...R.specialists,R.supervisor,'baseline'].map(engine=>({
    engine,side:engine==='fusion'?'LONG':'NONE',version_sha256:version,predicted_at_ms:time
   })),research_only:true,live_orders_allowed:false};
  journal=S.append(journal,obs,time+20);
  const outcome={type:'OUTCOME',id:'PAPER-RESULT-'+i,observation_id:obs.id,
   engine:'fusion',recorded_at_ms:time+3600020,label_type:'PAPER_SIMULATED',
   gross_paper_pct:i%3===0?-.2:.4,assumed_cost_bps:16,live_fill_verified:false,
   training_eligible:false};
  journal=S.append(journal,outcome,outcome.recorded_at_ms);
  rows.push({observation_id:obs.id,train_split:'REGISTERED_TRAIN_ONLY',holdout:false,
   paper_rule_registered:true,source_audited:true,outcome_audited:true,
   cost_provenance:'ASSUMED_PAPER',market:'BTC',predicted_at_ms:time,
   matured_at_ms:obs.mature_after_ms,recorded_outcome_ms:outcome.recorded_at_ms,
   model_version_sha256:version,input_sha256:obs.input_sha256,
   gross_paper_pct:outcome.gross_paper_pct,assumed_cost_bps:16,
   features,feature_snapshot_sha256:A.hash(features)});
 }
 return {m,journal,rows,now:base+n*7200000+3600000};
}
const f=fixture(),initial=M.fingerprint(f.m.champion),r=A.advance(f.m,f.journal,f.rows,f.now);
assert.equal(r.report.accepted_for_training,35);
assert.equal(r.report.independent_forward_net_evidence,0);
assert.equal(r.report.production_promotion_allowed,false);
assert.equal(r.report.live_orders_allowed,false);
assert.equal(M.fingerprint(r.next.champion),initial);
assert.notEqual(M.fingerprint(r.next.challenger),initial);
assert.equal(f.m.challenger.updates,0); // original remains frozen
assert.equal(r.report.comparison_action,'HOLD_CHAMPION');
const invalid=A.advance(f.m,f.journal,[{...f.rows[0],holdout:true},
 {...f.rows[1],features:{values:{trend:1},observed:['trend']},feature_snapshot_sha256:A.hash({values:{trend:1},observed:['trend']})}],f.now);
assert.equal(invalid.report.accepted_for_training,0);
assert.equal(invalid.report.rejected.length,2);
assert.throws(()=>A.advance(f.m,f.journal,[f.rows[0],f.rows[0]],f.now),/Duplicate/);
const tampered=structuredClone(f.journal);tampered[0].item.market='ETH';
assert.throws(()=>A.advance(f.m,tampered,f.rows,f.now),/Tampered/);
assert.throws(()=>A.advance(f.m,f.journal,[f.rows[0]],base+1000),/Invalid outcome/);
console.log('MAHORAGA auto learning: 35 synthetic TRAIN rows updated only challenger; holdout, tamper, chronology, outcome maturity and production freeze PASS');
