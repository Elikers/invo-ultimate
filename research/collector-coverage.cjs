/* INVO v6.8.3 — read-only observed candle freshness, not a trade signal. */
'use strict';
const BAR=300000,COINS=['BTC','ETH','SOL','JUP'];
function assess(health,now=Date.now()){
 if(!Number.isFinite(now))throw Error('Invalid audit clock');
 const t=Date.parse(health?.observed_utc||''),valid=Number.isFinite(t);
 const expected=Number.isFinite(health?.expected_completed_candle_t)?health.expected_completed_candle_t:null;
 const markets={};let complete=0,lagged=0;
 for(const coin of COINS){
  const r=health?.results?.[coin],processed=Number.isFinite(r?.last_processed_completed_candle_t)?r.last_processed_completed_candle_t:null;
  const lag=expected!==null&&processed!==null?Math.max(0,Math.round((expected-processed)/60000)):null;
  const ok=r?.status==='OK'&&processed!==null&&expected!==null&&lag===0;
  markets[coin]={status:r?.status||'NO_HEARTBEAT',last_processed_completed_candle_utc:processed===null?null:new Date(processed).toISOString(),
   behind_latest_completed_minutes:lag,full_latest_coverage:ok};
  if(ok)complete++;
  if(lag!==null&&lag>0)lagged++;
 }
 const age=valid?Math.max(0,Math.floor((now-t)/60000)):null;
 const flags=[];
 if(!valid||age>45)flags.push('COLLECTOR_HEARTBEAT_STALE_OR_MISSING');
 if(expected===null)flags.push('CANDLE_FRESHNESS_UNVERIFIED');
 if(complete<COINS.length)flags.push('FULL_MARKET_CANDLE_COVERAGE_UNVERIFIED');
 if(lagged)flags.push('MARKET_CANDLE_BEHIND_EXPECTED');
 return {schema:'invo-v6.8.3-coverage-1',checked_utc:new Date(now).toISOString(),heartbeat_age_minutes:age,
  expected_completed_candle_utc:expected===null?null:new Date(expected).toISOString(),
  markets_with_current_completed_candle:complete,total_markets:COINS.length,markets,flags,
  interpretation:'Read-only collector health. Fresh completed candles do not imply forward signals, fills or profitability; a later check cannot recover missed signal observation time.'};
}
module.exports={assess};
