'use strict';
// v10.5 final activation authority stays EXTERNAL and MANUAL; status is NEVER ACTIVE.
const crypto=require('node:crypto'),E=require('../evidence/evaluate.cjs'),REG=require('../learners/registration.json');
const hash=txt=>crypto.createHash('sha256').update(txt).digest('hex');
function readiness({baselineFiles,branchFiles,feed,models,paired,forward}={}){
 const blockers=[];
 const critical=['index.html','v61-core.js','research/run.cjs','research/v7-registration.json','.github/workflows/research.yml'];
 if(!baselineFiles||!branchFiles||critical.some(k=>typeof baselineFiles[k]!=='string'||
  hash(baselineFiles[k])!==hash(branchFiles[k])))blockers.push('PRODUCTION_BASELINE_MISMATCH');
 if(!feed||feed.stream_coverage_proven!==true||feed.reconnect_recovery_tested!==true||
 feed.clock_integrity_verified!==true||feed.durable_external_storage_verified!==true||
 feed.gap_free_or_quarantined!==true)blockers.push('CONTINUOUS_FEED_UNVERIFIED');
 if(!models||models.species!=='EIGHT_SPECIALISTS_PLUS_META'||!models.immutable_checkpoints||
 !models.trained_meta_out_of_expert_fit_period||!models.scalping_labeled_with_1m_microstructure||
 !models.champion_rollback_tested)blockers.push('ADAPTIVE_MODEL_COVERAGE_INCOMPLETE');
 if(!paired||paired.status!=='RESEARCH_ONLY_NOT_PROMOTABLE'||
 paired.blockers?.length||paired.opportunities<100)
  blockers.push('INDEPENDENT_PAIRED_NET_ADVANTAGE_NOT_PROVEN');
 if(!forward||forward.eligible_v10_closed<100||forward.per_group_min<30||
 !forward.correlation_controlled||!forward.all_costs_verified||!forward.human_signoff)
 blockers.push('PROSPECTIVE_ECONOMICS_AND_REVIEW_NOT_COMPLETE');
 // Even if all user provided assertions claim success, never return an ACTIVE or order-authorizing status.
 return {schema:'invo-v10-final-nonactivation-1',research_review:'REQUIRES_INDEPENDENT_MANUAL_APPROVAL',
  readiness:blockers.length?'BLOCKED':'MANUAL_RELEASE_REVIEW_ONLY',
  blockers,automatic_activation:false,orders_enabled:false,website_live_signals_enabled:false,
  production_risk_modified:false,allow_paid_deployments:false};
}
module.exports={readiness};
