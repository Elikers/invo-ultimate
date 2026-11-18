'use strict';
const fs=require('node:fs'),path=require('node:path');
const [research,main]=process.argv.slice(2);
if(!research||!main||path.resolve(research)===path.resolve(main))throw Error('Two distinct checkouts required');
const protectedFiles=['index.html','v61-core.js','research/run.cjs','research/v7-registration.json','.github/workflows/research.yml'];
for(const p of protectedFiles){
 const a=fs.readFileSync(path.join(research,p)),b=fs.readFileSync(path.join(main,p));
 if(!a.equals(b))throw Error('Production critical file changed: '+p);
}
const reg=JSON.parse(fs.readFileSync(path.join(research,'research/v10/shadow/registration.json'),'utf8'));
const legacy=JSON.parse(fs.readFileSync(path.join(main,'research/v7-paper-summary.json'),'utf8'));
if(reg.specialists.length!==8||legacy.schema!=='invo-v7.3-candidate-paper-summary-1')throw Error('Unverified source contract');
const out={schema:'invo-v10-capture-reliability-audit-1',utc:new Date().toISOString(),
 branch:'research/v10-capture-reliability',production_protected_files_identical:true,
 full_continuous_capture_deployed:false,approved_external_storage:false,
 bounded_live_pilot_verified_by_separate_run:true,eligibility_for_training:false,
 new_v10_forward_predictions_counted:0,new_v10_forward_closed_trades:0,
 legacy_candidate_captured:legacy.total_captured,legacy_candidate_closed:legacy.closed,
 profit_edge_established:false,website_mahoraga_activated:false,live_orders_enabled:false,
 release:'BLOCKED_PENDING_CONTINUOUS_SOURCE_FORWARD_EVIDENCE_AND_SEPARATE_REVIEW'};
fs.writeFileSync('mahoraga-capture-reliability-final.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out,null,2));
