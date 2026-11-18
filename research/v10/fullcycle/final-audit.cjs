'use strict';
const fs=require('node:fs'),path=require('node:path');
const REG=require('../shadow/registration.json'),T=require('./train.cjs'),E=require('./evaluation.cjs'),G=require('./readiness.cjs');
const [research,production]=process.argv.slice(2);
if(!research||!production||path.resolve(research)===path.resolve(production))
 throw Error('Two distinct read-only checkouts required');
const files=['index.html','v61-core.js','research/run.cjs','research/v7-registration.json','.github/workflows/research.yml'];
for(const p of files){
 if(!fs.readFileSync(path.join(research,p)).equals(fs.readFileSync(path.join(production,p))))
 throw Error('Main production critical file changed: '+p);
}
const legacy=JSON.parse(fs.readFileSync(path.join(production,'research/v7-paper-summary.json'),'utf8'));
if(legacy.schema!=='invo-v7.3-candidate-paper-summary-1'||!Number.isSafeInteger(legacy.closed))
 throw Error('Unknown main candidate journal');
if(REG.specialists.length!==8||T.init().models.scalping===undefined)throw Error('Eight-engine roster violation');
const evaluation=E.summarize([]),release=G.status({});
if(evaluation.evaluation_status!=='BLOCKED'||release.status!=='BLOCKED'||
 release.live_orders_allowed||release.website_signals_active||release.automated_champion_promotion)
 throw Error('Research readiness gate unexpectedly open');
const stages=[
 ['01','three-market bounded public feed collector and reconnection','SOFTWARE_TESTED_NOT_ALWAYS_ON'],
 ['02','SHA-256 local journal and sealed manifest','LOCAL_TESTED_EXTERNAL_DURABILITY_UNPROVEN'],
 ['03','causal seven-feature vector including receipt-only funding/OI and windowed volume','SYNTHETIC_FULL_FEATURES_TESTED_RECEIPT_TIME_NOT_EXCHANGE_TIME'],
 ['04','eight frozen versioned specialist decision positions','REGISTERED_INTERFACE_REAL_PREDICTIONS_NOT_RUNNING'],
 ['05','separately trained advisory meta challenger','SYNTHETIC_TEST_ONLY'],
 ['06','per-engine + gap multi-outcome append-only ledger','SYNTHETIC_TEST_ONLY'],
 ['07','matured paper exit labeling and quote-side replay','SYNTHETIC_TEST_ONLY'],
 ['08','fixed paper fees/slippage costs and missing fill provenance','PAPER_ASSUMPTIONS_NOT_VERIFIED_EXECUTION'],
 ['09','incremental eight-engine train-only challengers','OFFLINE_SYNTHETIC_AND_RESUME_TESTED'],
 ['10','local immutable checkpoint/manual rollback','LOCAL_TESTED_NO_EXTERNAL_REGISTRY'],
 ['11','matched forward evaluation and abstention monitoring','BLOCKED_NO_INDEPENDENT_V10_ECONOMIC_SAMPLE'],
 ['12','safe release gates and main fingerprint isolation','PASS_PRODUCTION_FROZEN_AND_ACTIVATION_BLOCKED']
];
const report={
 schema:'invo-v10-twelve-improvements-consolidated-audit-1',
 generated_utc:new Date().toISOString(),
 branch:'research/v10-twelve-improvements',
 all_twelve_research_software_tracks_addressed:true,
 all_twelve_operationally_complete:false,
 stage_results:stages.map(([id,name,status])=>({id,name,status})),
 production_protected_files_identical:true,
 source_12second_pilot_not_continuous:true,
 registered_specialists:REG.specialists,
 legacy_main_captured:legacy.total_captured,
 legacy_main_closed:legacy.closed,
 independently_verified_new_v10_forward_closed:0,
 automatic_live_retraining_running:false,
 independently_verified_adaptive_profitability:false,
 approved_external_storage:false,
 real_market_fill_verification:false,
 trading_orders_enabled:false,
 mah_oraga_website_active:false,
 outcome:'RESEARCH_SOFTWARE_IMPLEMENTED_AND_TESTED_LIVE_ACTIVATION_BLOCKED',
 release
};
fs.writeFileSync('mahoraga-v10-twelve-stage-final-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
