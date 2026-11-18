'use strict';
const fs=require('node:fs'),path=require('node:path'),S=require('./shadow.cjs'),R=require('./registration.json');
const [research,main]=process.argv.slice(2);
if(!research||!main)throw Error('Requires isolated research and separate main checkouts');
for(const file of ['index.html','v61-core.js','research/run.cjs','research/v7-registration.json','.github/workflows/research.yml'])
 if(!fs.readFileSync(path.join(research,file)).equals(fs.readFileSync(path.join(main,file))))
 throw Error('Production source changed: '+file);
const report={schema:'invo-v10-shadow-independent-audit-1',
 created_utc:new Date().toISOString(),
 branch:'research/v10-forward-shadow-gate',
 start_utc:R.start_utc,registration_sha256:S.hash(R),
 specialist_count:R.specialists.length,
 production_files_unchanged:true,
 prospective_forward_observations:0,prospective_closed_trades:0,
 continuous_collector_enabled:false,website_active:false,orders_enabled:false,
 net_profitability_demonstrated:false,
 readiness:'BLOCKED_PENDING_REAL_FORWARD_CAPTURE_AND_COST_EVIDENCE'};
fs.writeFileSync('mahoraga-forward-shadow-readiness.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
