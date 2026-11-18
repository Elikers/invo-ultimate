'use strict';
// Research-only historical TRAIN DEVELOPMENT. NOT independent holdout, not forward or account profit.
const C=require('../../../v61-core.js'),R=require('../../run.cjs'),M=require('./specialists.cjs'),REG=require('./registration.json');
const IDs=REG.experts.filter(x=>x!=='scalping');
function features(b,i){
 if(i<25||i>=b.length)throw Error('Insufficient completed historical lookback');
 const recent=b.slice(i-19,i+1),last=b[i],before=b[i-24];
 const avgVolume=b.slice(i-20,i).reduce((s,x)=>s+x.v,0)/20;
 const trend=Math.max(-5,Math.min(5,100*(last.c/before.c-1)));
 const volatility=Math.min(5,recent.reduce((s,x)=>s+100*(x.h-x.l)/x.c,0)/20);
 return {trend,volatility,volume_ratio:Math.min(10,avgVolume>0?last.v/avgVolume:0),
  // These were NOT available in the historical OHLCV archive, and therefore stay masked at zero.
  spread_bps:0,order_imbalance:0,funding:0,open_interest_change:0};
}
function train(archive,signal){
 if(!archive||archive.kind!=='RETROSPECTIVE_ONLY_NOT_FORWARD'||
 archive.source!=='BINANCE_VISION_USDM_HISTORICAL_ARCHIVE'||
 !/^[0-9a-f]{64}$/.test(archive.sha256)||!C.valid(archive.bars)||
 !['BTCUSDT','ETHUSDT','SOLUSDT'].includes(archive.symbol))throw Error('Invalid retrospective verified archive');
 if(typeof signal!=='function')throw Error('Frozen strategy function required');
 const bars=archive.bars,report=[];
 for(const id of IDs){
  const sig=Array(bars.length).fill(null);
  for(let i=65;i+12<bars.length;i++){
   const out=signal(id,bars.slice(Math.max(0,i-900),i+1));
   if(['LONG','SHORT'].includes(out?.side))sig[i]={side:out.side};
  }
  const trades=C.simulate(bars,sig,{stopPct:1,targetPct:1.5,costBps:8,hold:12});
  let model=M.create(id,'historical-training-research-not-forward'),used=0;
  for(const trade of [...trades].sort((a,b)=>a.exitIndex-b.exitIndex)){
   const predicted_at_ms=bars[trade.signalIndex].t+300000;
   const matured_at_ms=bars[trade.exitIndex].t+300000;
   if(matured_at_ms<=model.last_matured_ms||matured_at_ms<=predicted_at_ms)continue;
   const row={expert:id,purpose:'TRAIN',label_source:'MATURED_FROZEN_PAPER_SIM',
    predicted_at_ms,matured_at_ms,available_to_model_ms:predicted_at_ms,
    win_label:trade.netPct>0?1:0,features:features(bars,trade.signalIndex),
    registration_locked:true,source_verified:true};
   model=M.update(model,row).next;used++;
  }
  report.push({expert:id,retrospective_paper_trades:trades.length,
   training_examples:used,updated_model_sha256:M.fingerprint(model),
   trained_only_on:['OHLCV derived trend','OHLCV derived volatility','OHLCV volume ratio'],
   unavailable_features_zero_masked:['spread_bps','order_imbalance','funding','open_interest_change'],
   independent_model_accuracy:null,independent_net_profit:null,
   evaluation_status:'IN_SAMPLE_DEVELOPMENT_ONLY_NOT_VALIDATED'});
 }
 report.push({expert:'scalping',retrospective_paper_trades:0,training_examples:0,
  updated_model_sha256:null,independent_net_profit:null,
  evaluation_status:'NO_1M_ARCHIVE_OR_EXECUTION_DATA_NOT_TRAINED'});
 return {schema:'invo-v10-retrospective-training-rehearsal-1',market:archive.symbol,month:archive.month,
  archive_sha256:archive.sha256,source:'verified Binance Vision 5m OHLCV, exact frozen website signals + v6.1 paper simulator',
  reports:report,research_only:true,independent_forward_samples:0,
  live_orders:false,warning:'Already examined 2026 archives; training is development only. Not evidence of adaptive profitability or executable scalping.'};
}
module.exports={train,features};
