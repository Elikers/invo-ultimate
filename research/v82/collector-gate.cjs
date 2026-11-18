'use strict';
// v8.2 read-only provenance gate. A healthy old heartbeat is NOT a fresh collector.
// No retrospective signal reconstruction or dispatch.
const REQUIRED=['BTC','ETH','SOL','JUP'],FIVE=300000;
function inspect(health,nowMs,thresholdMs=45*60000){
 if(!Number.isFinite(nowMs)||!Number.isFinite(thresholdMs)||thresholdMs<=0)throw Error('Invalid clock/threshold');
 const t=Date.parse(health?.observed_utc||'');
 const age=Number.isFinite(t)&&t<=nowMs?nowMs-t:null;
 const expected=health?.expected_completed_candle_t;
 const observed=REQUIRED.map(coin=>{
  const x=health?.results?.[coin],end=x?.last_processed_completed_candle_t;
  const valid=Number.isSafeInteger(end)&&Number.isSafeInteger(expected)&&end===expected&&
   end%FIVE===0&&x.status==='OK'&&end+FIVE<=t+FIVE;
  return {market:coin,last_completed:t&&Number.isFinite(end)?new Date(end).toISOString():null,
    at_last_snapshot:valid?'COMPLETE':'UNVERIFIED'};
 });
 const flags=[];
 if(age===null)flags.push('INVALID_HEARTBEAT_TIME');
 else if(age>thresholdMs)flags.push('STALE_HEARTBEAT');
 if(observed.some(x=>x.at_last_snapshot!=='COMPLETE'))flags.push('MARKET_COVERAGE_UNVERIFIED');
 return {schema:'invo-v8.2-freshness-gate-1',status:flags.length?'REVIEW_REQUIRED':'LAST_OBSERVATION_RECENT',
  timestamp:health?.observed_utc??null,age_minutes:age===null?null:age/60000,
  markets:observed,flags,forward_events_fabricated:0,orders_placed:0,
  caveat:'This report cannot prove every 15-minute schedule slot or reconstruct observations lost during a collector outage.'};
}
module.exports={inspect};
