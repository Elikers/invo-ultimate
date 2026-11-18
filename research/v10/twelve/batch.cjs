'use strict';
// Bounded eight-expert research batch. A complete externally audited *per-expert*
// dataset is mandatory. No missing file becomes a fabricated zero-result win.
const fs=require('node:fs'),path=require('node:path'),REG=require('../learners/registration.json');
const STORE=require('../autolearn/store.cjs');
function run({root,journalByExpert,labelsByExpert,nowMs=Date.now(),dryRun=true}){
 if(typeof root!=='string'||!path.isAbsolute(root)||!journalByExpert||!labelsByExpert||
 !Number.isSafeInteger(nowMs)||dryRun!==true)throw Error('Research-only dry-run coordinator requires explicit inputs');
 const report={schema:'invo-v10-batch-challenger-audit-1',experts:{},updates:0,
  all_eight_inputs_available:true,no_production_promotions:true,orders_enabled:false,
  scheduled_continuous_service:false};
 for(const expert of REG.experts){
  const journal=journalByExpert[expert],labels=labelsByExpert[expert];
  if(!journal||!labels||!path.isAbsolute(journal)||!path.isAbsolute(labels)||
   !fs.existsSync(journal)||!fs.existsSync(labels)){
   report.experts[expert]={status:'MISSING_VERIFIED_INPUT_NO_TRAINING'};
   report.all_eight_inputs_available=false;continue;
  }
  // Caller must provide externally audited source. Never generate source_audited=true here.
  // Actually trains challenger if and only if the underlying authoritative gates admit it.
  const r=STORE.step(path.join(root,expert),expert,journal,labels,nowMs);
  report.experts[expert]={status:r.accepted_for_training?'CHALLENGER_UPDATED':'NO_ELIGIBLE_LABELS',
   updates:r.accepted_for_training,rejected:r.rejected.length};
  report.updates+=r.accepted_for_training;
 }
 return report;
}
module.exports={run};
