/* INVO v6.1 — deterministic hypothetical trade accounting; no exchange execution. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.INVOV61Core=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const BAR=300000;
function valid(b){if(!Array.isArray(b)||b.length<80)return false;for(let i=0;i<b.length;i++){const x=b[i];if(!x||![x.t,x.o,x.h,x.l,x.c].every(Number.isFinite)||x.o<=0||x.h<x.l||x.l<=0||x.h<Math.max(x.o,x.c)||x.l>Math.min(x.o,x.c)||(i&&x.t-b[i-1].t!==BAR))return false;}return true;}
function simulate(b,signals,o={}){
 const stopPct=Number(o.stopPct??1),targetPct=Number(o.targetPct??1.5),costBps=Number(o.costBps??8),hold=Number(o.hold??12);
 if(![stopPct,targetPct,costBps,hold].every(Number.isFinite)||stopPct<=0||targetPct<=0||costBps<0||!Number.isInteger(hold)||hold<1||hold>288)throw Error('Invalid fixed-risk settings');
 if(!valid(b))throw Error('Candle history missing, invalid, or discontinuous (5m required)');
 const trades=[];let next=65;const last=b.length-1;
 for(let i=65;i+hold<=last;i++){
  if(i<next)continue;const side=signals[i]?.side;if(side!=='LONG'&&side!=='SHORT')continue;
  const dir=side==='LONG'?1:-1,entryIndex=i+1,entry=b[entryIndex].o;
  const stop=entry*(1-dir*stopPct/100),target=entry*(1+dir*targetPct/100);
  let exitIndex=i+hold,exit=b[exitIndex].c,reason='TIME';
  for(let j=entryIndex;j<=i+hold;j++){
   const x=b[j];
   const stopGap=dir===1?x.o<=stop:x.o>=stop;
   if(stopGap){exitIndex=j;exit=x.o;reason='STOP_GAP';break;}
   const stopHit=dir===1?x.l<=stop:x.h>=stop;
   const targetHit=dir===1?x.h>=target:x.l<=target;
   if(stopHit){exitIndex=j;exit=stop;reason=targetHit?'STOP_BOTH':'STOP';break;}
   if(targetHit){exitIndex=j;exit=target;reason='TARGET';break;}
  }
  const grossPct=dir*(exit-entry)/entry*100;
  const netPct=grossPct-costBps/100;
  trades.push({time:b[i].t,side,signalIndex:i,entryIndex,exitIndex,entry,exit,reason,grossPct,netPct});
  next=exitIndex+1;
 }
 return trades;
}
function summary(trades){
 const n=trades.length;let equity=1,peak=1,dd=0,wins=0,sum=0,gain=0,loss=0;
 for(const t of trades){const x=t.netPct;sum+=x;if(x>0){wins++;gain+=x;}else if(x<0)loss+=-x;equity*=Math.max(0,1+x/100);peak=Math.max(peak,equity);dd=Math.max(dd,100*(peak-equity)/peak);}
 return {count:n,winPct:n?100*wins/n:null,expectancyPct:n?sum/n:null,profitFactor:loss>0?gain/loss:null,maxDrawdownPct:n?dd:null,compoundedPct:n?100*(equity-1):null,grossWins:gain,grossLosses:loss};
}
function validate(b,trades){
 const cut=b[0].t+0.7*(b[b.length-1].t-b[0].t),early=trades.filter(x=>x.time<cut),late=trades.filter(x=>x.time>=cut);
 const full=summary(trades),train=summary(early),test=summary(late);
 const pass=full.count>=60&&test.count>=20&&test.expectancyPct>0&&test.profitFactor!==null&&test.profitFactor>1.1&&test.maxDrawdownPct<20;
 return {full,early:train,late:test,cut,status:pass?'HISTORICAL SCREEN PASSED — NOT LIVE VALIDATED':full.count<60||test.count<20?'INSUFFICIENT SAMPLE — NOT VALIDATED':'PROFITABILITY SCREEN NOT PASSED'};
}
return {valid,simulate,summary,validate};
});
