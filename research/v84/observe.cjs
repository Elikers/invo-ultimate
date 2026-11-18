'use strict';
// v8.4: observational regime comparison; cannot alter original signal, entry or exit.
const {labelAt}=require('../v81/regimes.cjs');
const BUCKETS=['UP','DOWN','SIDEWAYS'];
function observe(bars,signalIndex,originalSignal,registration){
 if(!Number.isInteger(signalIndex)||signalIndex<24||signalIndex>=bars.length-1)throw Error('Signal must have a subsequent entry candle');
 if(!registration?.registered_utc||!registration?.commit_sha||!/^[0-9a-f]{40}$/.test(registration.commit_sha))
  throw Error('Missing immutable registration commit');
 const registered=Date.parse(registration.registered_utc);
 if(!Number.isFinite(registered)||bars[signalIndex].t+300000<=registered)
  throw Error('No retroactive forward registration');
 const label=labelAt(bars,signalIndex);
 if(!label||!BUCKETS.includes(label.trend))throw Error('Invalid regime');
 if(!['LONG','SHORT','NONE'].includes(originalSignal))throw Error('Invalid frozen signal');
 return {schema:'invo-v8.4-prospective-label-1',signal_open_t:bars[signalIndex].t,
  original_signal:originalSignal,regime:label.trend,volatility:label.volatility,
  registration_commit_sha:registration.commit_sha,attribution:'OBSERVATION_ONLY_NO_FILTER',
  recommendation:null,production_signal_changed:false};
}
module.exports={observe};
