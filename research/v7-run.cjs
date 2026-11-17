/* INVO v7 research-only runner; stores derived reports as CI artifacts, never touches trading journal. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,'research',file),'utf8'));
function main(){
 const journal=read('forward-journal.json');
 const loss=require('./v7-loss.cjs').diagnose(journal);
 const out={schema:'invo-v7-research-1',created_utc:new Date().toISOString(),phase:'v7.0',
 source_forward_updated_utc:journal.updated_utc,loss_attribution:loss,
 notice:'Research-only computed from existing paper journal. Not a production strategy update, independent evidence or live trading results.'};
 fs.writeFileSync(path.join(root,'research/v7-report.json'),JSON.stringify(out,null,2)+'\n');
 console.log('INVO v7 evidence',JSON.stringify({phase:out.phase,closed:loss.closed,loss_categories:loss.outcomes,cost_scenarios:loss.fixed_cost_stress_bps}));
 return out;
}
if(require.main===module)try{main()}catch(e){console.error(e);process.exitCode=1}
module.exports={main};
