'use strict';
// MAHORAGA v10.6 off-policy empirical challengers. NO PRODUCTION MODEL WRITES.
// No evidence verifier wired by default: zero real training until external trust exists.
const crypto=require('node:crypto');
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const START=Date.parse('2026-11-19T00:00:00Z');
const MARKETS=['BTC','ETH','SOL'],SIDES=['LONG','SHORT'];
function empty(){
 return {schema:'mahoraga-v106-challenger-v1',revision:0,processed:[],
    families:Object.fromEntries(MARKETS.map(m=>[m,Object.fromEntries(SIDES.map(s=>[s,{
      samples:0,winning:0,sum_net:0,posterior_win_probability:0.5
    }]))])),research_only:true,auto_promotion:false,champion_modified:false,
    live_orders:false};
}
function safeTrain(state,records,now,independentVerifier=()=>false){
 if(state?.schema!=='mahoraga-v106-challenger-v1'||!Array.isArray(state.processed)||
    !state.research_only||state.auto_promotion!==false||state.live_orders!==false||
    !Number.isSafeInteger(now)||now<START||typeof independentVerifier!=='function')
      throw Error('Invalid research-only state or clock');
 const next=structuredClone(state),seen=new Set(next.processed);
 if(seen.size!==next.processed.length)throw Error('Corrupt duplicate checkpoint history');
 let accepted=0,blocked=0,duplicates=0,lastMaturity=0;
 for(const r of records){
  if(!r||!r.observation_id||typeof r.observation_id!=='string'){
   blocked++;continue;
  }
  if(seen.has(r.observation_id)){duplicates++;continue}
  // Out-of-order or future matured labels must never be used as training data.
  if(!MARKETS.includes(r.market)||!SIDES.includes(r.side)||
      !Number.isSafeInteger(r.predicted_at_ms)||r.predicted_at_ms<START||
      !Number.isSafeInteger(r.matured_at_ms)||
      r.matured_at_ms<=r.predicted_at_ms||r.matured_at_ms>now||
      r.matured_at_ms<lastMaturity||!Number.isFinite(r.net_including_funding)||
      Math.abs(r.net_including_funding)>1||!Number.isFinite(r.imbalance)||
      Math.abs(r.imbalance)>1||!Number.isFinite(r.spread_bps)||
      r.spread_bps<0||r.spread_bps>100||
      r.funding_reconciled!==true||r.full_venue_costs_verified!==true||
      r.source_integrity_verified!==true||r.prediction_precommitted!==true||
      r.external_anchor_verified!==true||r.research_only!==true||
      r.training_eligible!==true||
      independentVerifier(r)!==true){
    blocked++;continue;
  }
  const bucket=next.families[r.market][r.side];
  bucket.samples++;bucket.winning+=Number(r.net_including_funding>0);
  bucket.sum_net+=r.net_including_funding;
  // Beta(2,2) shrinkage, no guarantee of reliable posterior calibration.
  bucket.posterior_win_probability=(bucket.winning+2)/(bucket.samples+4);
  seen.add(r.observation_id);next.processed.push(r.observation_id);
  lastMaturity=r.matured_at_ms;accepted++;
 }
 if(accepted)next.revision++;
 if(next.processed.length>50000)throw Error('Evidence archive exceeds bounded registry');
 const report={schema:'mahoraga-v106-training-audit-v1',accepted,blocked,duplicates,
    revision:next.revision,model_sha256:digest(next.families),
    independent_profitability_verified:false,forward_strategy_evidence_sufficient:false,
    auto_promotion:false,live_orders:false,champion_changed:false,
    research_only:true};
 return {next,report};
}
module.exports={empty,safeTrain,digest};
