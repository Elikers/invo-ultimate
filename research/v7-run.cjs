/* INVO v7 research-only runner; stores derived reports as CI artifacts, never touches trading journal. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,'research',file),'utf8'));
async function main(){
 const journal=read('forward-journal.json');
 const loss=require('./v7-loss.cjs').diagnose(journal);
 const out={schema:'invo-v7-research-1',created_utc:new Date().toISOString(),phase:'v7.4',
 source_forward_updated_utc:journal.updated_utc,loss_attribution:loss,
 preregistered_experiments:[],experiment_provenance:{budget_pairs:2,candidate_variants_per_pair:2,baseline_per_pair:1,
  independent_holdout:false,selection_status:'PREVIOUSLY_VIEWED_HISTORICAL_WINDOW_NO_PROMOTION'},
 notice:'Research only. No production strategy change or independent validation. All comparisons are retrospective and illustrative.'};
 const E=require('./v7-experiments.cjs'),R=require('./run.cjs');
 const signal=R.strategyFromWebsite(fs.readFileSync(path.join(root,'index.html'),'utf8'));
 const BAR=300000,end=Math.floor(Date.now()/BAR)*BAR,start=end-14*288*BAR;
 for(const pair of E.PAIRS){
  const response=await fetch('https://api.hyperliquid.xyz/info',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({type:'candleSnapshot',req:{coin:pair.coin,interval:'5m',startTime:start,endTime:end-1}}),
   signal:AbortSignal.timeout(25000)});
  if(!response.ok)throw Error('Read-only candle API failed: '+response.status);
  const bars=R.parse(await response.json(),pair.coin,end);
  if(bars[0].t!==start||bars.at(-1).t!==end-BAR)throw Error('Incomplete experiment history');
  out.preregistered_experiments.push(E.evaluate(bars,pair.coin,signal));
 }

 out.robustness=require('./v7-robustness.cjs').inspect(out.preregistered_experiments);
 const candidatePath=path.join(root,'research/v7-paper-journal.json');
 const candidateJournal=fs.existsSync(candidatePath)?JSON.parse(fs.readFileSync(candidatePath,'utf8')):null;
 out.prospective_gate=require('./v7-forward-gate.cjs').evaluate(read('v7-registration.json'),journal,out.preregistered_experiments,new Date().toISOString(),candidateJournal);
 out.decision=require('./v7-decisions.cjs').decide(loss,out.robustness,out.prospective_gate,out.preregistered_experiments,read('v7-registration.json'));
 fs.writeFileSync(path.join(root,'research/v7-report.json'),JSON.stringify(out,null,2)+'\n');
 console.log('INVO v7 evidence',JSON.stringify({phase:out.phase,closed:loss.closed,decision:out.decision?.decision,approved:out.decision?.approved_candidate_count,retrospective_screens:out.robustness?.historical_screen_count,candidate_captured:out.prospective_gate?.experimental_captured,experiments:out.preregistered_experiments.map(x=>({market:x.coin,strategy:x.strategy,candidates:x.candidates.map(z=>({id:z.id,closed:z.trade_count,net8:z.by_cost_bps['8'].full.expectancyPct,net16:z.by_cost_bps['16'].full.expectancyPct}))}))}));
 return out;
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
module.exports={main};
