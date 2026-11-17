/* INVO v6.9 P1: operational alert classifier, no trading decisions. */
'use strict';
const C=require('./collector-coverage.cjs');
const COINS=['BTC','ETH','SOL','JUP'];
function evaluate(health,now=Date.now()){
 const v=C.assess(health,now);
 const problems=[];
 if(v.flags.includes('COLLECTOR_HEARTBEAT_STALE_OR_MISSING'))problems.push('STALE_HEARTBEAT');
 if(v.flags.includes('CANDLE_FRESHNESS_UNVERIFIED'))problems.push('CANDLE_TIMESTAMP_UNVERIFIED');
 for(const coin of COINS){
  const m=v.markets[coin];
  if(m.status!=='OK')problems.push('MARKET_NOT_OK_'+coin);
  else if(m.behind_latest_completed_minutes!==0)problems.push('MARKET_CANDLE_LAG_'+coin);
 }
 return {schema:'invo-v6.9-data-alert-1',checked_utc:v.checked_utc,
  status:problems.length?'ACTION_REQUIRED':'HEALTHY_AT_LAST_OBSERVATION',
  issues:problems,collector_utc:health?.observed_utc||null,
  expected_completed_candle_utc:v.expected_completed_candle_utc,
  markets_with_current_completed_candle:v.markets_with_current_completed_candle,
  warning:'Last saved heartbeat only; healthy data is NOT proof of frequent cron execution or profitable signals.'};
}
module.exports={evaluate};
