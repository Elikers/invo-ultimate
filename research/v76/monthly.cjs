#!/usr/bin/env node
/* v7.6 retrospective historical analysis using exact website signals and frozen v6.1 simulator. */
'use strict';
const cp=require('node:child_process'),path=require('node:path'),fs=require('node:fs');
const C=require('../../v61-core.js'),R=require('../run.cjs');
const COINS=['BTCUSDT','ETHUSDT','SOLUSDT'],MONTHS=['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09'];
const IDS=['fusion','sweep','auction','pullback','volbreak','mean','strict'];
const ROOT=path.resolve(__dirname,'../..');
function summarize(archive, signal) {
 if(!archive||archive.kind!=='RETROSPECTIVE_ONLY_NOT_FORWARD'||archive.source!=='BINANCE_VISION_USDM_HISTORICAL_ARCHIVE'||
   !COINS.includes(archive.symbol)||!MONTHS.includes(archive.month)||
   !/^[0-9a-f]{64}$/.test(archive.sha256))throw Error('Unverified monthly archive metadata');
 if(!Array.isArray(archive.bars)||archive.bars.length<8000||!C.valid(archive.bars))throw Error('Invalid monthly 5m candles');
 const rows=IDS.flatMap(id=>R.runOne(archive.bars,id,signal).map(r=>({
   engine:r.strategy,cost_bps:r.cost_bps_round_trip,trades:r.trade_count,
   folds:r.folds.map(f=>({name:f.name,closed:f.count,net_expectancy_pct:f.expectancyPct,
     profit_factor:f.profitFactor,max_drawdown_pct:f.maxDrawdownPct})),screen:r.screen
 })));
 return {schema:'invo-v7.6-monthly-frozen-historical-1',evidence:'RETROSPECTIVE_ONLY_NOT_FORWARD',
   venue:'Binance USD-M perpetual',symbol:archive.symbol,month:archive.month,
   source_sha256:archive.sha256,bars:archive.bars.length,
   risk:{stop_pct:1,target_pct:1.5,max_hold_bars:12,cost_scenarios_bps:[8,16]},
   signal_source:'Existing website signal extracted by research/run.cjs',
   simulator:'Unmodified v61-core.js via runOne',
   risk_warning:'This is hypothetical candle replay, excludes actual spread, funding, variable fees and liquidation. Historical folds are not forward validation.',
   results:rows};
}
function main(){
 const symbol=process.argv[2],month=process.argv[3];
 if(!COINS.includes(symbol)||!MONTHS.includes(month))throw Error('Unregistered symbol/month');
 const raw=cp.execFileSync('python3',[path.join(__dirname,'monthly_archive.py'),symbol,month],{
   encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024
 });
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const result=summarize(JSON.parse(raw),R.strategyFromWebsite(html));
 console.log(JSON.stringify(result,null,2));
}
if(require.main===module)try{main()}catch(e){console.error('V7.6_RESEARCH_REJECTED:',e.message);process.exitCode=1}
module.exports={summarize};
