'use strict';
const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const T=require('./historical-train.cjs'),R=require('../../run.cjs');
const root=path.resolve(__dirname,'../../..');
const symbol='BTCUSDT',month='2026-04';
const raw=cp.execFileSync('python3',[path.join(root,'research/v76/monthly_archive.py'),symbol,month],{
 encoding:'utf8',timeout:180000,maxBuffer:15*1024*1024});
const archive=JSON.parse(raw);
if(archive.symbol!==symbol||archive.month!==month||archive.bars.length<8000)
 throw Error('Archive provenance or coverage failure');
const signal=R.strategyFromWebsite(fs.readFileSync(path.join(root,'index.html'),'utf8'));
const result=T.train(archive,signal);
fs.writeFileSync('mahoraga-v10-btc-apr-development.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:'TRAINING_REHEARSAL_REAL_HISTORICAL_INPUTS_NOT_VALIDATED',
 market:symbol,month,verified_archive_sha256:archive.sha256,
 expert_updates:result.reports.map(r=>({id:r.expert,examples:r.training_examples})),
 independent_forward_samples:0,profitability_claimed:false},null,2));
