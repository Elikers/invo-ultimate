'use strict';
const assert=require('node:assert/strict'),os=require('node:os'),path=require('node:path'),fs=require('node:fs');
const D=require('./decisions.cjs'),L=require('./multi-ledger.cjs'),P=require('./paper.cjs'),
 T=require('./train.cjs'),C=require('./checkpoint.cjs'),E=require('./evaluation.cjs'),
 F=require('./features.cjs'),M=require('./manifest.cjs'),G=require('./readiness.cjs'),
 STEP=require('./scheduled-step.cjs'),META=require('./meta-challenger.cjs');
const R=require('../shadow/registration.json'),SM=require('../learners/specialists.cjs');
const t=Date.parse('2026-11-20T01:00:00Z'),hash='a'.repeat(64);
const values={trend:1,volatility:.3,volume_ratio:1.5,spread_bps:2,
 order_imbalance:.2,funding:.0001,open_interest_change:.1};
const fsnap={market:'BTC',at_ms:t,sha256:hash,
 features:{observed:Object.keys(values),values},
 entry_reference_quote:{bid:100,ask:100.02,source_received_ms:t-500,source_sha256:hash}};
const models=Object.fromEntries([...R.specialists,R.supervisor,'baseline'].map(engine=>
 [engine,{version_sha256:hash,frozen_before_prediction:true,registered_at_ms:t-1000}]));
const predictions=Object.fromEntries(['fusion','baseline'].map(engine=>
 [engine,{side:'LONG',predicted_at_ms:t,input_sha256:hash,model_sha256:hash,research_only:true}]));
const created=D.observation(fsnap,models,predictions,t+10,'BTC-PROSP-20261120-001');
assert.equal(created.authenticated_predictions,2);
assert.equal(created.no_trade_decisions,8);
const o=created.observation;let ledger=L.add([],o,t+10);
assert.equal(L.verify(ledger).observations,1);
const futureQuote={bid:102.5,ask:102.52,source_received_ms:t+3600010,source_sha256:hash};
const fusion=P.label(o,'fusion',futureQuote,t+3600020);
const baseline=P.label(o,'baseline',futureQuote,t+3600021);
const none=P.label(o,'sweep',null,t+3600022);
assert.equal(fusion.result,'PAPER');assert.equal(none.result,'NO_TRADE');
assert.ok(fusion.assumed_net_pct<fusion.gross_paper_pct);
assert.throws(()=>L.add(ledger,{...fusion,gross_paper_pct:fusion.gross_paper_pct+0.1},t+3600020),/not reproducible/);
const shortObs={...o,decisions:o.decisions.map(d=>d.engine==='fusion'?{...d,side:'SHORT'}:d)};
const shortLabel=P.label(shortObs,'fusion',futureQuote,t+3600020);
assert.ok(Math.abs(shortLabel.gross_paper_pct-100*(100-102.52)/100)<1e-10);
assert.throws(()=>P.label(o,'fusion',futureQuote,t+100),/not matured/);
ledger=L.add(ledger,fusion,t+3600020);
ledger=L.add(ledger,baseline,t+3600021);
ledger=L.add(ledger,none,t+3600022);
assert.equal(L.verify(ledger).engine_outcomes,3);
assert.throws(()=>L.add(ledger,{...fusion,id:'paper-duplicate',recorded_at_ms:t+3600030},t+3600030),/duplicate/);
const challenger=T.init(),first=T.train(challenger,ledger,t+3600030);
assert.equal(first.report.new_challenger_updates,1);
assert.equal(first.report.champion_unchanged,true);
assert.notEqual(SM.fingerprint(first.next.models.fusion.challenger),
 SM.fingerprint(first.next.models.fusion.champion));
const repeat=T.train(first.next,ledger,t+3600040);
assert.equal(repeat.report.new_challenger_updates,0);
const evalReport=E.summarize(ledger,t+3600040);
assert.equal(evalReport.evaluation_status,'BLOCKED');
assert.equal(evalReport.captured_observations,1);
assert.equal(evalReport.abstentions.sweep,1);
assert.equal(evalReport.independent_net_execution_evidence,0);
assert.equal(G.status({}).status,'BLOCKED');
const mt=t+7200000;
const metaSnap={...fsnap,at_ms:mt,entry_reference_quote:{...fsnap.entry_reference_quote,source_received_ms:mt-500}};
const metaPredictions=Object.fromEntries([...R.specialists,R.supervisor,'baseline'].map(engine=>
 [engine,{side:'LONG',predicted_at_ms:mt,input_sha256:hash,model_sha256:hash,
 research_only:true,probability:.72,reliability:.85}]));
const metaObs=D.observation(metaSnap,models,metaPredictions,mt+10,'BTC-META-ALL-20261120').observation;
let metaLog=L.add([],metaObs,mt+10);
const metaExit={...futureQuote,source_received_ms:mt+3600010};
metaLog=L.add(metaLog,P.label(metaObs,'mahoraga',metaExit,mt+3600020),mt+3600020);
const initialMeta=META.init(),updatedMeta=META.train(initialMeta,metaLog,mt+3600030);
assert.equal(updatedMeta.report.new_updates,1);
assert.equal(updatedMeta.report.automatic_promotion,false);
assert.equal(META.train(updatedMeta.next,metaLog,mt+3600040).report.new_updates,0);
const incompletePred=structuredClone(metaLog);
incompletePred[0].item.decisions[0].probability=null;
incompletePred[0].sha256=L.hash({prev:'GENESIS',item:incompletePred[0].item});
incompletePred[1].prev=incompletePred[0].sha256;
incompletePred[1].sha256=L.hash({prev:incompletePred[1].prev,item:incompletePred[1].item});
assert.equal(META.train(META.init(),incompletePred,mt+3600030).report.new_updates,0);
const empty=F.observe([], 'BTC',t);
assert.equal(empty.full_feature_set,false);
assert.deepEqual(empty.features.observed,[]);
const poisoned=structuredClone(ledger);
poisoned[0].item.training_feature_snapshot.values.trend=4;
assert.throws(()=>L.verify(poisoned),/Tampered/);
const noFuture=structuredClone(ledger);
assert.throws(()=>L.add(noFuture,{...fusion,recorded_at_ms:t+3600045,id:'early'},t+100),/Future/);
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mahoraga-all12-'));
try{
 fs.writeFileSync(path.join(dir,'multi-shadow.jsonl'),ledger.map(x=>JSON.stringify(x)).join('\n')+'\n');
 const firstStep=STEP.trainingStep(dir,t+3600040);
 assert.equal(firstStep.status,'RESEARCH_CHALLENGER_CHECKPOINTED');
 assert.equal(firstStep.new_challenger_updates,1);
 const laterStep=STEP.trainingStep(dir,t+3600050);
 assert.equal(laterStep.status,'NO_NEW_ELIGIBLE_PAPER_OUTCOMES');
 assert.equal(laterStep.new_challenger_updates,0);
 assert.equal(laterStep.revision,1);
 const saved=C.save(dir,first.next,'candidate01');
 assert.equal(C.load(dir,'candidate01',saved.sha256).models.models.fusion.challenger.updates,1);
 const restored=C.restore(dir,'candidate01',saved.sha256);
 assert.equal(restored.auto_promotion,false);
 assert.throws(()=>C.save(dir,first.next,'candidate01'),/exists/);
 for(const f of ['raw.jsonl','events.jsonl','health.jsonl','connection-health.jsonl'])
  fs.writeFileSync(path.join(dir,f),'{"synthetic":true}\n');
 M.seal(dir);assert.equal(M.verify(dir).external_storage_proven,false);
 fs.appendFileSync(path.join(dir,'raw.jsonl'),'changed\n');
 assert.throws(()=>M.verify(dir),/modified/);
}finally{fs.rmSync(dir,{recursive:true,force:true});}
console.log('MAHORAGA 12-stage offline test PASS: source missingness, 10 decisions, multi outcomes, assumed costs, 1 challenger update, replay lock, checkpoint rollback, evaluation and safe release BLOCKED');
