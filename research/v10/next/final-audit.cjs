'use strict';
const fs=require('node:fs'),path=require('node:path'),E=require('./paired.cjs'),R=require('./release.cjs'),REG=require('../learners/registration.json');
const [research,main]=process.argv.slice(2);
if(!research||!main)throw Error('Two isolated checkouts required');
for(const p of ['index.html','v61-core.js','research/run.cjs','research/v7-registration.json','.github/workflows/research.yml']){
 if(!fs.readFileSync(path.join(research,p)).equals(fs.readFileSync(path.join(main,p))))
 throw Error('Production-critical source modified: '+p);
}
const journal=JSON.parse(fs.readFileSync(path.join(main,'research/v7-paper-summary.json'),'utf8'));
const reg={sha256:'f'.repeat(64),start_ms:Date.parse('2026-11-19T00:00:00Z')};
const paired=E.evaluate([],reg);
const result=R.audit(paired,{continuous_capture_verified:false,
 reconnect_and_clock_health_verified:false,durable_storage_verified:false,
 model_versions_frozen:false,rollback_rehearsed:false,quality_schema_verified:false,
 execution_costs_verified:false,drawdown_tail_review_passed:false,
 concentration_limits_reviewed:false,all_eight_specialists_validated:false},{});
if(result.status!=='BLOCKED'||result.live_orders_allowed||result.website_active||
 result.automatic_promotion||REG.experts.length!==8)throw Error('Unsafe release');
const report={schema:'mahoraga-v10-five-gates-final-1',utc:new Date().toISOString(),
 branch:'research/v10-mahoraga-five-gates',production_source_identical:true,
 legacy_captured:journal.total_captured,legacy_closed:journal.closed,
 eligible_mahoraga_v10_forward_closed:0,adaptive_net_profitability_verified:false,
 gate1:'OFFLINE_TESTED_ONLY_NOT_CONTINUOUS',gate2:'OFFLINE_TESTED_ONLY_NOT_FULLY_TRAINED',
 gate3:'SYNTHETIC_TRAINED_ONLY_NO_INDEPENDENT_EDGE',gate4:paired.status,gate5:result};
fs.writeFileSync('mahoraga-five-gates-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
