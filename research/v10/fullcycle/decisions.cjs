'use strict';
// Stage 4-5: register all eight versioned specialist decisions and the supervisory abstention.
// If any model/source is unavailable, record NONE; NEVER synthesize a trade signal.
const S=require('../shadow/shadow.cjs'),R=require('../shadow/registration.json');
const F=require('./features.cjs'),crypto=require('node:crypto');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const engines=[...R.specialists,R.supervisor,'baseline'];
const REGHASH=S.hash(R);
function observation(featureSnapshot,models,predictions,now,id){
 if(!featureSnapshot||!R.markets.includes(featureSnapshot.market)||
 !Number.isSafeInteger(now)||now<Date.parse(R.start_utc)||!Number.isSafeInteger(featureSnapshot.at_ms)||
 featureSnapshot.at_ms>now||now-featureSnapshot.at_ms>120000||
 !featureSnapshot.features||typeof id!=='string'||id.length<8)
 throw Error('Untrusted or backfilled feature snapshot');
 const d=engines.map(engine=>{
  const spec=models?.[engine],prediction=predictions?.[engine];
  const frozen=spec&&typeof spec.version_sha256==='string'&&/^[a-f0-9]{64}$/.test(spec.version_sha256)&&
   spec.frozen_before_prediction===true&&spec.registered_at_ms<=featureSnapshot.at_ms&&
   spec.registered_at_ms>=0;
  const proven=frozen&&prediction&&['LONG','SHORT','NONE'].includes(prediction.side)&&
   prediction.predicted_at_ms===featureSnapshot.at_ms&&prediction.input_sha256===featureSnapshot.sha256&&
   prediction.model_sha256===spec.version_sha256&&prediction.research_only===true;
  return {engine,side:proven?prediction.side:'NONE',
   version_sha256:frozen?spec.version_sha256:hash('UNAVAILABLE:'+engine),
   predicted_at_ms:featureSnapshot.at_ms,
   reason:proven?'FROZEN_RESEARCH_PREDICTION':'MISSING_AUTHENTICATED_PREDICTION',
   probability:proven&&Number.isFinite(prediction.probability)&&prediction.probability>=0&&prediction.probability<=1?prediction.probability:null,
   reliability:proven&&Number.isFinite(prediction.reliability)&&prediction.reliability>=0&&prediction.reliability<=1?prediction.reliability:null,
   executable:false};
 });
 const o={type:'OBSERVATION',id,market:featureSnapshot.market,venue:R.venue,
  predicted_at_ms:featureSnapshot.at_ms,captured_at_ms:now,
  available_to_model_ms:featureSnapshot.at_ms,
  mature_after_ms:featureSnapshot.at_ms+R.maturity_minutes*60000,
  input_sha256:featureSnapshot.sha256,registration_sha256:REGHASH,
  entry_reference_quote:featureSnapshot.entry_reference_quote||null,
  training_feature_snapshot:featureSnapshot.features,
  training_feature_sha256:hash(featureSnapshot.features),decisions:d,
  research_only:true,live_orders_allowed:false};
 S.verifyFrame(o,now);
 return {observation:o,authenticated_predictions:d.filter(x=>x.reason==='FROZEN_RESEARCH_PREDICTION').length,
  no_trade_decisions:d.filter(x=>x.side==='NONE').length,profit_claimed:false};
}
module.exports={observation,engines,hash};
