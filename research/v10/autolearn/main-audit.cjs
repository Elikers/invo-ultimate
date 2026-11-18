'use strict';
const fs=require('node:fs'),path=require('node:path');
const [research,main]=process.argv.slice(2);
if(!research||!main||path.resolve(research)===path.resolve(main))throw Error('Separate checkouts required');
for(const p of ['index.html','v61-core.js','research/run.cjs',
 'research/v7-registration.json','.github/workflows/research.yml']){
 if(!fs.readFileSync(path.join(research,p)).equals(fs.readFileSync(path.join(main,p))))
 throw Error('Protected production file changed: '+p);
}
const TR=require(path.resolve(research,'research/v10/autolearn/training-registration.json'));
const S=require(path.resolve(research,'research/v10/shadow/shadow.cjs'));
const M=require(path.resolve(research,'research/v10/autolearn/loop.cjs'));
const R=require(path.resolve(research,'research/v10/shadow/registration.json'));
const old=JSON.parse(fs.readFileSync(path.join(main,'research/v7-paper-summary.json')));
const state=M.init('fusion'),report=M.advance(state,[],[],Date.now()).report;
if(TR.purpose!=='RESEARCH_CHALLENGER_TRAIN_ONLY'||R.specialists.length!==8||
 report.accepted_for_training!==0||report.production_promotion_allowed||
 report.live_orders_allowed||old.schema!=='invo-v7.3-candidate-paper-summary-1')
 throw Error('Unsafe learning or source audit');
const result={schema:'invo-v10-automatic-research-learning-readiness-1',
 checked_at_utc:new Date().toISOString(),
 branch:'research/v10-auto-learning-loop',research_challenger_implementation:'BUILT_TESTED',
 train_only_registration_sha256:S.hash(TR),start_utc:TR.train_start_utc,
 production_critical_files_identical:true,
 champion_mutated:false,production_models_mutated:false,
 research_only_learning_enabled_in_code:true,automatic_scheduled_runtime_deployed:false,
 forward_market_journal_connected_to_auto_learner:false,
 eligible_v10_forward_training_records_verified_in_this_audit:0,
 legacy_candidate_captured:old.total_captured,legacy_candidate_closed:old.closed,
 trading_orders_enabled:false,website_mahoraga_active:false,
 independent_profitability_proven:false,
 activation:'BLOCKED_PENDING_VERIFIED_DATA_AND_SEPARATE_REVIEW',
 caution:'CI uses synthetic fixtures and a no-op real audit, not a deployed continuous self-learning AI'};
fs.writeFileSync('mahoraga-auto-learning-readiness.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
