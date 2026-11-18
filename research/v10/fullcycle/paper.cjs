'use strict';
// Stage 7-8: label only after immutable exit horizon and verified source receipt.
// Costs are hypothetical, never actual fills; market-data gaps -> MISSING_DATA.
const crypto=require('node:crypto'),R=require('../shadow/registration.json');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const POLICY=Object.freeze({schema:'invo-v10-fixed-paper-horizon-v1',horizon_minutes:R.maturity_minutes,
  entry:'conservative predecision bid/ask source quote',exit:'future source-observed bid/ask quote',
  funding:'NOT_MODELLED_BLOCK_IF_REQUIRED',max_quote_age_ms:3000,
  fixed_fee_per_side_bps:4,fixed_slippage_per_side_bps:2,
  cost_provenance:'ASSUMED_NOT_EXECUTED',version:'research-v10'});
function verifyQuote(q,now){
 return q&&Number.isFinite(q.bid)&&Number.isFinite(q.ask)&&q.bid>0&&q.ask>q.bid&&
 Number.isSafeInteger(q.source_received_ms)&&q.source_received_ms<=now&&
 now-q.source_received_ms<=POLICY.max_quote_age_ms&&
 typeof q.source_sha256==='string'&&/^[a-f0-9]{64}$/.test(q.source_sha256);
}
function label(observation,engine,exitQuote,now){
 const d=observation?.decisions?.find(x=>x.engine===engine);
 if(!d||!Number.isSafeInteger(now)||now<observation.mature_after_ms)
 throw Error('Engine decision missing or paper horizon not matured');
 const common={type:'ENGINE_OUTCOME',id:'paper-'+observation.id+'-'+engine,
  observation_id:observation.id,engine,recorded_at_ms:now,
  source_exit_received_ms:now,execution_fill_verified:false,
  training_eligible:false,research_only:true};
 if(d.side==='NONE')return {...common,result:'NO_TRADE'};
 const enter=observation.entry_reference_quote;
 if(!verifyQuote(enter,observation.predicted_at_ms)||
    !verifyQuote(exitQuote,now)||exitQuote.source_received_ms<observation.mature_after_ms)
 return {...common,result:'MISSING_DATA',reason:'QUOTE_MISSING_STALE_OR_PREMATURE',
  source_exit_received_ms:now};
 // LONG buys at ask and exits at bid; SHORT sells bid and buys back ask.
 const entry=d.side==='LONG'?enter.ask:enter.bid;
 const exit=d.side==='LONG'?exitQuote.bid:exitQuote.ask;
 const gross=d.side==='LONG'?100*(exit/entry-1):100*(entry/exit-1);
 const cost=(POLICY.fixed_fee_per_side_bps+POLICY.fixed_slippage_per_side_bps)*2;
 return {...common,result:'PAPER',source_exit_received_ms:exitQuote.source_received_ms,
  gross_paper_pct:gross,total_assumed_cost_bps:cost,
  assumed_net_pct:gross-cost/100,
  cost_provenance:POLICY.cost_provenance,exit_rule_sha256:hash(POLICY),
  exit_price_source_sha256:exitQuote.source_sha256,
  warning:'Reference paper arithmetic, not verified fills or realized net P&L'};
}
module.exports={label,verifyQuote,POLICY,hash};
