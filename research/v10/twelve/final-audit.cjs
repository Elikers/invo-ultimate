'use strict';
// Independent final research audit; never deploys or promotes a model.
// Read fresh main in a separate checkout and fail on any production source difference.
const fs=require('node:fs'),path=require('node:path');
const E=require('./readiness.cjs'),SR=require('../shadow/registration.json');
const [research,main]=process.argv.slice(2);
if(!research||!main||path.resolve(research)===path.resolve(main))
 throw Error('Require distinct current research and main checkouts');
const files=['index.html','v61-core.js','research/run.cjs',
 'research/v7-registration.json','.github/workflows/research.yml'];
for(const f of files){
 if(!fs.readFileSync(path.join(research,f)).equals(fs.readFileSync(path.join(main,f))))
 throw Error('Production-critical bytes differ: '+f);
}
const legacy=JSON.parse(fs.readFileSync(path.join(main,'research/v7-paper-summary.json'),'utf8'));
if(legacy.schema!=='invo-v7.3-candidate-paper-summary-1')throw Error('Unexpected legacy source');
const gate=E.audit({registeredExperiment:{sha256:'a'.repeat(64),
 start_ms:Date.parse(SR.start_utc)}});
if(gate.status!=='BLOCKED'||gate.activation_authorized||gate.production_trading_enabled||
 gate.model_promotion_enabled)throw Error('False-ready MAHORAGA release');
const items=[
 ['Continuous market data','BOUNDED_PILOT_ONLY_NO_24_7_SERVICE'],
 ['Evidence storage','LOCAL_HASHED_EXPORT_NO_EXTERNAL_DURABILITY'],
 ['Prediction-time features','IMPLEMENTED_OFFLINE_SOURCE_GATED'],
 ['Eight specialists','VERSIONED_RESEARCH_ABSTENTION_NOT_VALIDATED'],
 ['Meta supervisor','RESEARCH_PROTOTYPE_NO_INDEPENDENT_TRAINING'],
 ['Ten-engine paper ledger','IMPLEMENTED_OFFLINE_10_LABELS'],
 ['Matured outcome labels','IMPLEMENTED_FROZEN_PAPER_SIM'],
 ['Cost accounting','ASSUMPTION_AWARE_NOT_EXECUTABLE_FILLS'],
 ['Automatic challenger retraining','GATED_COORDINATOR_NO_SCHEDULE_OR_APPROVED_INPUTS'],
 ['Model registry and rollback','IMPLEMENTED_RESEARCH_ONLY'],
 ['Independent performance evidence','NOT_ESTABLISHED_ZERO_VERIFIED_V10_FORWARD_CLOSED'],
 ['Security and release','TESTED_FAIL_CLOSED_NOT_OPERATIONALLY_CERTIFIED']
].map(([name,status],i)=>({phase:i+1,name,status}));
const out={schema:'invo-v10-twelve-gates-final-audit-1',
 checked_utc:new Date().toISOString(),branch:'research/v10-twelve-gates',
 production_files_byte_identical:true,website_mahoraga_active:false,
 verified_v10_forward_closed_trades_in_this_audit:0,
 historical_or_synthetic_not_forward:true,independent_profitable_edge:false,
 legacy_candidate_captured:legacy.total_captured,legacy_candidate_closed:legacy.closed,
 all_twelve_research_software_gates_present:true,
 all_twelve_operational_improvements_complete:false,
 auto_training_continuously_running:false,paid_infrastructure_created:false,
 trading_orders_allowed:false,model_promotion_allowed:false,
 release:gate.status,release_blockers:gate.blockers,phases:items};
fs.writeFileSync('mahoraga-twelve-gates-readiness.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out,null,2));
