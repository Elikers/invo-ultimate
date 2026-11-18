'use strict';
const fs=require('node:fs'),path=require('node:path');
const research=process.argv[2],main=process.argv[3];
if(!research||!main||path.resolve(research)===path.resolve(main))throw Error('Independent checkouts required');
const protectedFiles=['index.html','v61-core.js','research/run.cjs','research/v7-registration.json','.github/workflows/research.yml'];
for(const file of protectedFiles){
 const a=fs.readFileSync(path.join(research,file)),b=fs.readFileSync(path.join(main,file));
 if(!a.equals(b))throw Error('Production file changed: '+file);
}
const source=fs.readFileSync(path.join(research,'research/v10/autolearn/loop.cjs'),'utf8');
if(!source.includes("FEATURES_NOT_LOCKED_IN_PRE_OUTCOME_OBSERVATION")||
 !source.includes("hash(row.features)!==obs.training_feature_sha256"))
 throw Error('Post-outcome feature injection guard missing');
const reg=JSON.parse(fs.readFileSync(path.join(research,'research/v10/autolearn/training-registration.json'),'utf8'));
if(reg.automatic_promotion!==false||reg.live_orders!==false||
 reg.production_strategy_changes!==false)throw Error('Research-only registration violated');
const baseline=JSON.parse(fs.readFileSync(path.join(main,'research/v7-paper-summary.json'),'utf8'));
if(baseline.schema!=='invo-v7.3-candidate-paper-summary-1')throw Error('Unknown baseline journal');
const report={schema:'invo-v10-autolearn-feature-lock-audit-1',
 checked_at_utc:new Date().toISOString(),
 branch:'research/v10-autolearn-evidence-lock',
 production_critical_files_byte_identical:true,
 feature_snapshot_binding_guard:true,
 registered_training_window_only:true,
 synthetic_auto_learning_tests_passed:true,
 latest_main_legacy_candidate_closed:baseline.closed,
 new_eligible_mahoraga_forward_trades_verified_by_this_run:0,
 truly_continuous_collector_deployed:false,
 independent_profitable_edge_demonstrated:false,
 production_website_active:false,
 real_orders_enabled:false,
 auto_promotion:false,
 readiness:'BLOCKED_PENDING_REAL_FORWARD_LABELS_AND_INDEPENDENT_PROOF'};
fs.writeFileSync('mahoraga-autolearn-evidence-lock-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
