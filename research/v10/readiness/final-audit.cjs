'use strict';
const fs=require('node:fs'),path=require('node:path'),E=require('../evidence/evaluate.cjs');
const research=process.argv[2],main=process.argv[3];
if(!research||!main)throw Error('Research checkout and separate production checkout required');
const read=(dir,file)=>JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));
const mission=read(research,'research/v10/mission.json');
const reg=read(research,'research/v10/learners/registration.json');
const baseline=read(main,'research/v7-paper-summary.json');
const web=fs.readFileSync(path.join(main,'index.html'),'utf8');
if(mission.architecture.expert_models.join(',')!==reg.experts.join(',')||
 reg.experts.length!==8||web.toLowerCase().includes('mahoraga'))
 throw Error('Research mission and production isolation mismatch');
const legacy=E.mainSnapshot(baseline,reg);
const release=E.evaluate({forward_trade_count:0,
 groups:reg.experts.map(id=>({id,closed:0,lower_bound_95_net_pct:null})),
 holdout_registration_immutable:false,matched_forward_baselines:false,costs_verified:false,
 execution_fills_verified:false,clustering_and_multiplicity_adjusted:false,
 drawdown_and_tails_reviewed:false,data_gap_audit_passed:false,all_models_frozen_before_test:false});
if(release.status!=='BLOCKED'||legacy.eligible_v10_trades!==0||
 release.website_inference_enabled||release.live_orders_enabled||release.automatic_production_promotion)
 throw Error('Unexpected MAHORAGA activation or false readiness');
const report={schema:'invo-v10-preactivation-current-readiness-1',
 checked_at_utc:new Date().toISOString(),
 branch:'research/v10-mahoraga-preactivation',expert_count:reg.experts.length,
 prototype_present:true,production_mahoraga_active:false,production_trading_logic_unchanged:true,
 historical_one_month_rehearsal_is_independent_test:false,
 new_v10_forward_closed_trades:0,
 current_legacy_candidate_captured:legacy.read_only_legacy_captured,
 current_legacy_candidate_closed:legacy.read_only_legacy_closed,
 release,disclaimer:'Status BLOCKED is the expected safe result. CI tests only confirm software invariants, not trading profitability.'};
fs.writeFileSync('mahoraga-v10-preactivation-readiness.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
