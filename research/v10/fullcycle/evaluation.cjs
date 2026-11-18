'use strict';
// Stage 11: paired prospective net paper comparison, per-engine coverage and abstentions.
// Not a proof of actual fills or statistical independence.
const S=require('./multi-ledger.cjs'),REG=require('../shadow/registration.json');
const E=require('../next/paired.cjs');
const TRAIN=require('../autolearn/training-registration.json');
const crypto=require('node:crypto');
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const registration={sha256:digest(TRAIN),start_ms:Date.parse(TRAIN.independent_test_start_utc)};
function summarize(log,now=Date.now()){
 const verified=S.verify(log);
 const obs=new Map(log.filter(r=>r.item.type==='OBSERVATION').map(r=>[r.item.id,r.item]));
 const labels=new Map(log.filter(r=>r.item.type==='ENGINE_OUTCOME').map(r=>
  [r.item.observation_id+'|'+r.item.engine,r.item]));
 const results=[],abstentions={},missing={};
 for(const engine of [...REG.specialists,REG.supervisor,'baseline']){
  abstentions[engine]=0;missing[engine]=0;
 }
 for(const o of obs.values()){
  for(const d of o.decisions){
   if(d.side==='NONE')abstentions[d.engine]++;
   if(!labels.has(o.id+'|'+d.engine))missing[d.engine]++;
  }
  // Only truly independent after the protected test start, with trusted costs/fills.
  if(o.predicted_at_ms<registration.start_ms)continue;
  const baseline=labels.get(o.id+'|baseline');
  for(const id of REG.specialists){
   const c=labels.get(o.id+'|'+id);
   if(!c||!baseline||c.result!=='PAPER'||baseline.result!=='PAPER')continue;
   results.push({id:o.id+'|'+id,expert:id,predicted_at_ms:o.predicted_at_ms,
    matured_at_ms:Math.max(c.recorded_at_ms,baseline.recorded_at_ms),
    challenger_gross_pct:c.gross_paper_pct,baseline_gross_pct:baseline.gross_paper_pct,
    challenger_cost_bps:c.total_assumed_cost_bps,baseline_cost_bps:baseline.total_assumed_cost_bps,
    registration_sha256:registration.sha256,forward_only:true,
    frozen_before_prediction:o.decisions.every(x=>x.reason==='FROZEN_RESEARCH_PREDICTION'),
    matched_opportunity:true,source_verified:false,costs_verified:false,
    test_only:true,from_training:false});
  }
 }
 const paired=E.evaluate(results,registration);
 // Raw derived paper outcomes NEVER carry true exchange-fill verified flags.
 return {schema:'invo-v10-forward-readiness-1',journal:verified,
  captured_observations:obs.size,abstentions,unlabeled_opportunities:missing,
  paired_hypothetical_records:results.length,
  independent_net_execution_evidence:0,
  evaluation_status:'BLOCKED',paired_software_diagnostic:paired.status,
  blockers:['UNVERIFIED_EXECUTION_COSTS','NO_REAL_MATCHED_EXECUTION_FILLS',
   'CONTINUOUS_SOURCE_AND_MODEL_VERSION_AUDIT_PENDING'],
  no_promotion:true,no_orders:true};
}
module.exports={summarize,registration};
