#!/usr/bin/env node
/* v7.5: Reuse exact frozen website signal and v6.1 simulator. Research branch ONLY. */
'use strict';
const path=require('node:path'),fs=require('node:fs'),cp=require('node:child_process');
const C=require('../../v61-core.js'),R=require('../run.cjs');
const ROOT=path.resolve(__dirname,'../..');
const SUPPORTED=['BTCUSDT','ETHUSDT','SOLUSDT'];
const IDS=['fusion','sweep','auction','pullback','volbreak','mean','strict'];
function reportFromArchive(archive) {
 if(!archive || archive.kind!=='RETROSPECTIVE_ONLY_NOT_FORWARD' || !SUPPORTED.includes(archive.symbol))
   throw Error('Invalid archive provenance or instrument');
 const bars=archive.bars;
 if(!Array.isArray(bars)||bars.length!==4032||!C.valid(bars))throw Error('Incomplete or discontinuous historical bars');
 if(!Array.isArray(archive.hashes)||archive.hashes.length!==14||
   archive.hashes.some(h=>!/^([a-f0-9]{64})$/.test(h.sha256)))throw Error('Missing verified source hashes');
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const signal=R.strategyFromWebsite(html);
 const results=IDS.flatMap(id=>R.runOne(bars,id,signal));
 return {
   schema:'invo-v7.5-external-historical-1',
   evidence:'RETROSPECTIVE_ARCHIVE_ONLY_NOT_FORWARD_NOT_TRADABLE',
   source:archive.source,symbol:archive.symbol,
   window_start_utc:new Date(bars[0].t).toISOString(),
   window_end_utc:new Date(bars.at(-1).t+300000).toISOString(),
   count:bars.length,
   verified_daily_sha256:archive.hashes,
   fixed_rules:{strategies:IDS,stop_pct:1,target_pct:1.5,max_hold_bars:12,
     cost_bps_round_trip:[8,16],engine:'Exact production website signal + existing v6.1 simulator (research/run.cjs)'},
   results,
   warning:[
     'Retrospective historical sample only: NOT a new forward trade, live fill or portfolio performance.',
     'Cost scenarios are hypothetical; variable spread, exchange fees, funding, slippage and liquidation not fully modeled.',
     'Fourteen-day historical folds are correlated and not statistically independent of other venues.',
     'No fitted parameter selection or live strategy deployment.'
   ]
 };
}
function main(){
 const symbol=process.argv[2]||'BTCUSDT',start=process.argv[3]||'2026-09-01';
 if(!SUPPORTED.includes(symbol)||start!=='2026-09-01')throw Error('Predeclared source date and market only');
 const stdout=cp.execFileSync('python3',[path.join(__dirname,'archive_export.py'),symbol,start],
    {encoding:'utf8',timeout:180000,maxBuffer:4*1024*1024});
 const report=reportFromArchive(JSON.parse(stdout));
 const overview=report.results.map(r=>({engine:r.strategy,cost_bps:r.cost_bps_round_trip,
     train:r.folds[0].expectancyPct,monitor:r.folds[1].expectancyPct,
     holdout:r.folds[2].expectancyPct,
     holdout_count:r.folds[2].count,screen:r.screen}));
 console.log(JSON.stringify({schema:report.schema,source:report.source,symbol:report.symbol,
   bars:report.count,start:report.window_start_utc,end:report.window_end_utc,
   daily_verified_hashes:report.verified_daily_sha256,
   warning:report.warning,overview},null,2));
}
if(require.main===module)try{main()}catch(e){console.error('Historical research rejected:',e.message);process.exitCode=1}
module.exports={reportFromArchive};
