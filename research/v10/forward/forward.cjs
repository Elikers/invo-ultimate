'use strict';
// MAHORAGA v10.3: point-in-time public L2 hypothesis, non-executable, no production imports.
const crypto=require('node:crypto'),A=require('../data/feed-adapters.cjs');
const R=require('./registration.json');
const hash=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const START=Date.parse(R.start_utc),HORIZON=R.horizon_minutes*60000;
function assert(x,msg){if(!x)throw Error(msg)}
function source(raw,receivedAt,now){
  assert(typeof raw==='string'&&raw.length<=1000000,'Missing or excessive raw source');
  assert(Number.isSafeInteger(receivedAt)&&Number.isSafeInteger(now) && receivedAt<=now &&
    now-receivedAt<=R.max_quote_age_ms,'No fresh real-time receipt');
  const parsed=JSON.parse(raw),b=A.book(parsed);
  assert(R.markets.includes(b.coin),'Unregistered market');
  assert(b.sourceEventMs<=now+R.max_source_clock_skew_ms &&
    receivedAt-b.sourceEventMs<=R.max_quote_age_ms &&
    b.sourceEventMs-receivedAt<=R.max_source_clock_skew_ms,
    'Source event timestamp stale, missing or in future');
  assert(b.payload.bids.length>=R.decision_rules.depth_levels_each_side &&
    b.payload.asks.length>=R.decision_rules.depth_levels_each_side,'Incomplete source order book');
  return {b,raw_sha256:hash(raw),received_at_ms:receivedAt};
}
function propose(raw,receivedAt,now){
  assert(now>=START,'PRE_REGISTRATION_NO_PREDICTIONS');
  const data=source(raw,receivedAt,now),p=data.b.payload;
  const n=R.decision_rules.depth_levels_each_side;
  const buy=p.bids.slice(0,n).reduce((s,x)=>s+x.sz,0),sell=p.asks.slice(0,n).reduce((s,x)=>s+x.sz,0);
  assert(buy+sell>0,'No observed depth volume');
  const imbalance=(buy-sell)/(buy+sell);
  const spread=p.spread_bps;
  const side=spread>R.decision_rules.max_spread_bps?'NONE':
    imbalance>R.decision_rules.imbalance_long_above?'LONG':
    imbalance<R.decision_rules.imbalance_short_below?'SHORT':'NONE';
  const record={schema:'mahoraga-v103-prospective-observation-v1',type:'OBSERVATION',
    market:data.b.coin,venue:R.venue,registration_sha256:hash(R),
    source_raw_sha256:data.raw_sha256,source_event_ms:data.b.sourceEventMs,
    received_at_ms:receivedAt,decision_time_ms:now,mature_after_ms:now+HORIZON,
    entry_quote:{bid:p.best_bid,ask:p.best_ask},imbalance,spread_bps:spread,
    side,reason:side==='NONE'?'NO_TRADE_BY_PREREGISTERED_FILTER':'PREREGISTERED_BOOK_IMBALANCE',
    source_quality:'PUBLIC_L2_SNAPSHOT_NOT_VERIFIED_FILL',trade_executed:false,
    outcomes_seen_at_prediction:false,approved_for_live:false,training_eligible:false};
  record.id=hash(record);
  return Object.freeze(record);
}
function verifyObservation(obs){
  assert(obs?.schema==='mahoraga-v103-prospective-observation-v1'&&obs.type==='OBSERVATION'&&
    obs.registration_sha256===hash(R)&&R.markets.includes(obs.market)&&
    ['LONG','SHORT','NONE'].includes(obs.side)&&!obs.approved_for_live&&
    obs.trade_executed===false&&obs.training_eligible===false,'Invalid observation');
  assert(Number.isSafeInteger(obs.decision_time_ms)&&obs.decision_time_ms>=START&&
    Number.isSafeInteger(obs.source_event_ms)&&obs.source_event_ms<=obs.decision_time_ms+R.max_source_clock_skew_ms&&
    Number.isSafeInteger(obs.received_at_ms)&&obs.received_at_ms<=obs.decision_time_ms&&
    obs.decision_time_ms-obs.received_at_ms<=R.max_quote_age_ms&&
    obs.mature_after_ms===obs.decision_time_ms+HORIZON,'Invalid observation timestamps');
  const id=obs.id,{id:unused,...rest}=obs;
  assert(id===hash(rest),'Tampered observation digest');
  return true;
}
function mature(obs,exitRaw,exitReceipt,now){
  verifyObservation(obs);
  assert(Number.isSafeInteger(now)&&now>=obs.mature_after_ms,'Outcome not matured');
  const base={schema:'mahoraga-v103-prospective-outcome-v1',type:'OUTCOME',
    observation_id:obs.id,market:obs.market,side:obs.side,
    maturity_ms:obs.mature_after_ms,recorded_at_ms:now,
    research_only:true,profitability_verified:false,approved_for_live:false,
    actual_fill_verified:false,forward_sample_authenticated_externally:false};
  if(obs.side==='NONE')return {...base,status:'NO_TRADE',paper_net_ex_funding:null};
  if(!exitRaw||!Number.isSafeInteger(exitReceipt)||exitReceipt<obs.mature_after_ms ||
     exitReceipt>obs.mature_after_ms+R.exit_tolerance_ms)
    return {...base,status:'MISSING_MATURITY_QUOTE',paper_net_ex_funding:null};
  let quote;
  try {quote=source(exitRaw,exitReceipt,now)}
  catch{return {...base,status:'INVALID_EXIT_QUOTE',paper_net_ex_funding:null}}
  if(quote.b.coin!==obs.market||quote.b.sourceEventMs<obs.mature_after_ms-R.max_source_clock_skew_ms)
    return {...base,status:'INVALID_EXIT_MARKET_OR_TIME',paper_net_ex_funding:null};
  const entry=obs.side==='LONG'?obs.entry_quote.ask:obs.entry_quote.bid;
  const exit=obs.side==='LONG'?quote.b.payload.best_bid:quote.b.payload.best_ask;
  const gross=obs.side==='LONG'?exit/entry-1:(entry-exit)/entry;
  const assumedCost=2*(R.execution_assumptions.taker_fee_bps_per_side+
    R.execution_assumptions.additional_slippage_bps_per_side)/10000;
  return {...base,status:'PAPER_OUTCOME_WITH_FUNDING_UNKNOWN',
    source_exit_sha256:quote.raw_sha256,source_exit_time_ms:quote.b.sourceEventMs,
    gross_reference_return:gross,assumed_execution_cost_return:assumedCost,
    paper_net_ex_funding:gross-assumedCost,
    paper_net_including_funding:null,
    caveat:'Hypothetical public quotes; unverified actual fills, slippage and funding. Not real account profit.'};
}
function gap(market,now,reason){
  assert(R.markets.includes(market)&&Number.isSafeInteger(now),'Bad gap record');
  return {schema:'mahoraga-v103-capture-gap-v1',market,at_ms:now,reason,
    no_backfill:true,training_eligible:false,approved_for_live:false};
}
module.exports={propose,source,mature,gap,verifyObservation,hash,START,HORIZON};
