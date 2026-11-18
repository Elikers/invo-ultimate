'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const Store=require('./store.cjs'),A=require('./loop.cjs'),S=require('../shadow/shadow.cjs'),R=require('../shadow/registration.json'),M=require('../learners/specialists.cjs'),P=require('./training-registration.json');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mahoraga-loop-persist-'));
try{
 const model=A.init('fusion'),version=M.fingerprint(model.champion);
 const start=Date.parse('2026-11-21T00:00:00Z'),features={values:{
  trend:.4,volatility:.8,volume_ratio:1.1,spread_bps:3,order_imbalance:.2,funding:.0001,open_interest_change:.2
 },observed:['trend','volatility','volume_ratio','spread_bps','order_imbalance','funding','open_interest_change']};
 let journal=[],rows=[];
 for(let i=0;i<3;i++){
  const time=start+i*7200000;
  const o={type:'OBSERVATION',id:'PERSISTENCE-OBS-'+i,market:'BTC',venue:'hyperliquid',
   predicted_at_ms:time,captured_at_ms:time+5,available_to_model_ms:time-20,mature_after_ms:time+3600000,
   input_sha256:'b'.repeat(64),registration_sha256:S.hash(R),
   decisions:[...R.specialists,R.supervisor,'baseline'].map(engine=>({engine,
    side:engine==='fusion'?'LONG':'NONE',version_sha256:version,predicted_at_ms:time})),
   research_only:true,live_orders_allowed:false};
  journal=S.append(journal,o,time+5);
  const res={type:'OUTCOME',id:'PERSISTENCE-RESULT-'+i,observation_id:o.id,engine:'fusion',
   recorded_at_ms:time+3600001,label_type:'PAPER_SIMULATED',gross_paper_pct:.25,
   assumed_cost_bps:16,live_fill_verified:false,training_eligible:false};
  journal=S.append(journal,res,res.recorded_at_ms);
  rows.push({observation_id:o.id,training_registration_sha256:A.hash(P),
   train_split:'REGISTERED_TRAIN_ONLY',holdout:false,paper_rule_registered:true,source_audited:true,
   outcome_audited:true,cost_provenance:'ASSUMED_PAPER',market:'BTC',
   predicted_at_ms:o.predicted_at_ms,matured_at_ms:o.mature_after_ms,
   recorded_outcome_ms:res.recorded_at_ms,model_version_sha256:version,input_sha256:o.input_sha256,
   gross_paper_pct:.25,assumed_cost_bps:16,features,feature_snapshot_sha256:A.hash(features)});
 }
 const evidence=path.join(dir,'shadow.jsonl'),labels=path.join(dir,'labels.json');
 fs.writeFileSync(evidence,journal.map(x=>JSON.stringify(x)).join('\n')+'\n');fs.writeFileSync(labels,JSON.stringify(rows));
 const stateDir=path.join(dir,'models');fs.mkdirSync(stateDir);
 const now=start+3*7200000+3600000;
 const first=Store.step(stateDir,'fusion',evidence,labels,now);
 assert.equal(first.accepted_for_training,3);assert.equal(first.checkpoint_written,true);
 const loaded=Store.readState(stateDir,'fusion');
 assert.equal(loaded.challenger.updates,3);assert.equal(loaded.champion.updates,0);
 const again=Store.step(stateDir,'fusion',evidence,labels,now);
 assert.equal(again.accepted_for_training,0);assert.equal(again.checkpoint_written,false);
 assert.equal(Store.readState(stateDir,'fusion').challenger.updates,3);
 const checkpoint=path.join(stateDir,'fusion-challenger.json');
 const corrupt=JSON.parse(fs.readFileSync(checkpoint));corrupt.state.challenger.bias=9999;
 fs.writeFileSync(checkpoint,JSON.stringify(corrupt));
 assert.throws(()=>Store.readState(stateDir,'fusion'),/invalid or damaged/);
}finally{fs.rmSync(dir,{recursive:true,force:true})}
console.log('MAHORAGA persistent step synthetic three labels: checkpoint, idempotent rerun, champion frozen, tamper rejection PASS');
