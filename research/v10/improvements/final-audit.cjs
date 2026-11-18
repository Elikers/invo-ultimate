'use strict';
// Final isolated comparison against main checkout; no changes, no external approval, no orders.
const fs=require('node:fs'),path=require('node:path');
const G=require('./release.cjs'),REG=require('../learners/registration.json');
const root=process.argv[2],prod=process.argv[3];
if(!root||!prod)throw Error('Require two distinct checkouts');
const files=['index.html','v61-core.js','research/run.cjs','research/v7-registration.json','.github/workflows/research.yml'];
const readFiles=dir=>Object.fromEntries(files.map(file=>[file,fs.readFileSync(path.join(dir,file),'utf8')]));
const main=JSON.parse(fs.readFileSync(path.join(prod,'research/v7-paper-summary.json'),'utf8'));
const mission=JSON.parse(fs.readFileSync(path.join(root,'research/v10/mission.json'),'utf8'));
if(REG.experts.length!==8||mission.architecture.expert_models.join('|')!==REG.experts.join('|'))
 throw Error('Unregistered specialist roster');
const baselineFiles=readFiles(prod),branchFiles=readFiles(root);
const status=G.readiness({
 baselineFiles,branchFiles,
 feed:{stream_coverage_proven:false,reconnect_recovery_tested:false,
 clock_integrity_verified:false,durable_external_storage_verified:false,gap_free_or_quarantined:false},
 models:{species:'EIGHT_SPECIALISTS_PLUS_META',immutable_checkpoints:false,
 trained_meta_out_of_expert_fit_period:false,scalping_labeled_with_1m_microstructure:false,
 champion_rollback_tested:false},
 paired:{status:'RESEARCH_ONLY_NOT_PROMOTABLE',opportunities:0,
 blockers:['NO_NEW_FORWARD_EVIDENCE','NO_VERIFIED_EXECUTION_NET_RETURNS']},
 forward:{eligible_v10_closed:0,per_group_min:0,correlation_controlled:false,
 all_costs_verified:false,human_signoff:false}});
if(main.schema!=='invo-v7.3-candidate-paper-summary-1'||!Number.isSafeInteger(main.closed)||
 status.readiness!=='BLOCKED'||!status.blockers.includes('CONTINUOUS_FEED_UNVERIFIED')||
 !status.blockers.includes('ADAPTIVE_MODEL_COVERAGE_INCOMPLETE')||
 status.blockers.includes('PRODUCTION_BASELINE_MISMATCH')||
 status.orders_enabled||status.website_live_signals_enabled)throw Error('Unsafe release audit');
const result={schema:'invo-v10-five-improvements-audit-1',created_utc:new Date().toISOString(),
 branch:'research/v10-five-improvements',specialists:REG.experts,
 production_fingerprints_unchanged:true,earlier_legacy_candidate_closed:main.closed,
 earlier_legacy_candidate_captured:main.total_captured,
 eligible_mahoraga_v10_forward_closed:0,
 experimental_8bps_2026_historical_replay_not_independent:true,
 release:status,
 warning:'Even if all retrospective jobs pass, this does not validate continuous trading, fills or positive forward net expectancy.'};
fs.writeFileSync('mahoraga-v10-five-improvements-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({result:'PASS_SAFETY_RELEASE_BLOCKED',blocks:status.blockers,
 production_unchanged:true,mahoraga_active:false},null,2));
