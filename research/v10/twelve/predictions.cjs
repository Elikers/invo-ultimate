'use strict';
// Eight frozen expert predictions + research-only MAHORAGA supervisor, never executable.
// Untrained models must ABSTAIN; never fabricate a signal from a .5 default.
const crypto=require('node:crypto'),REG=require('../learners/registration.json');
const MODELS=require('../learners/specialists.cjs'),META=require('../supervisor/supervisor.cjs');
const SHADOW=require('../shadow/shadow.cjs'),SR=require('../shadow/registration.json');
const sha=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const H='0'.repeat(64);
function observe({features,models,baseline,availableAtMs,nowMs,registration=SR}){
 if(registration!==SR)throw Error('Registration must be canonical');
 if(!features||!SR.markets.includes(features.market)||features.decisionTimeMs!==nowMs||
 !Number.isSafeInteger(nowMs)||nowMs<Date.parse(SR.start_utc)||
 !Number.isSafeInteger(availableAtMs)||availableAtMs>nowMs||
 nowMs-availableAtMs>3000||features.live_orders_allowed!==false)
 throw Error('Untrusted or stale feature provenance');
 const d=[];
 for(const expert of SR.specialists){
  const m=models?.[expert];
  if(m&&m.expert!==expert)throw Error('Wrong expert model');
  // Requiring independent evaluation before predictive signals.
  const ready=m&&m.updates>=30&&m.source==='VERIFIED_RESEARCH_CHAMPION'&&
   Object.keys(features.values).length===REG.feature_names.length;
  const p=ready?MODELS.probability(m,features.values):null;
  d.push({engine:expert,side:'NONE',predicted_at_ms:nowMs,
   probability:p,version_sha256:m?MODELS.fingerprint(m):H,
   reason:ready?'RESEARCH_POLICY_HOLD_UNTIL_INDEPENDENT_REVIEW':'UNTRAINED_OR_MISSING_FEATURES'});
 }
 const selected=META.decide(d.slice(0,3).map(x=>({
  expert:x.engine,side:x.side,probability:x.probability??.5,reliability:0,
  predicted_at_ms:nowMs,model_fingerprint:x.version_sha256
 })),{data_valid:false,costs_verified:false,spread_bps:features.values.spread_bps??NaN});
 d.push({engine:SR.supervisor,side:selected.side,predicted_at_ms:nowMs,
  version_sha256:sha({supervisor:'research-v10-no-trade',registration:SR.schema})});
 if(!baseline||!['LONG','SHORT','NONE'].includes(baseline.side)||
 typeof baseline.version_sha256!=='string'||!/^[a-f0-9]{64}$/.test(baseline.version_sha256)||
 baseline.frozen_source_verified!==true||baseline.predicted_at_ms!==nowMs)
 throw Error('Missing independently frozen baseline decision');
 d.push({engine:'baseline',side:baseline.side,predicted_at_ms:nowMs,version_sha256:baseline.version_sha256});
 const obs={type:'OBSERVATION',id:features.market+'-v10-'+nowMs,
  market:features.market,venue:SR.venue,predicted_at_ms:nowMs,
  captured_at_ms:nowMs,available_to_model_ms:availableAtMs,
  mature_after_ms:nowMs+SR.maturity_minutes*60000,
  input_sha256:sha(features),registration_sha256:SHADOW.hash(SR),
  decisions:d,training_feature_snapshot:{values:features.values,observed:features.observed},
  training_feature_sha256:sha({values:features.values,observed:features.observed}),
  research_only:true,live_orders_allowed:false};
 SHADOW.verifyFrame(obs,nowMs);
 return obs;
}
module.exports={observe};
