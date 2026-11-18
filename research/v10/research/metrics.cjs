'use strict';
// Descriptive paper statistics from already audited receipts. Never describe as realized P&L.
const C=require('./causal.cjs');
function summarize(bundles){
 if(!Array.isArray(bundles))throw Error('Bundles must be an array');
 const runIds=new Set(),rows=[];
 let pending=0,unverified=0,gaps=0,abstain=0;
 for(const b of bundles){
  if(!b||!b.receipt||!b.sources)throw Error('Missing provenance bundle');
  const id=String(b.receipt.run_id||'');
  if(!/^[0-9]{8,16}$/.test(id)||runIds.has(id))throw Error('Invalid or duplicate run');
  runIds.add(id);
  const report=C.evaluate(b.receipt,b.sources,b.outcome||null);
  pending+=report.pending_labels;unverified+=report.missing_data_labels;gaps+=report.source_gaps;
  abstain+=report.abstentions_labeled;
  if(!b.outcome)continue;
  for(const x of b.outcome.outcomes){
   if(x.status!=='PAPER_OUTCOME_WITH_FUNDING_UNKNOWN')continue;
   if(!Number.isFinite(x.paper_net_ex_funding))throw Error('Invalid return');
   rows.push({market:x.market,observation_id:x.observation_id,
    hypothetical_net_ex_funding:x.paper_net_ex_funding});
  }
 }
 const gains=rows.filter(x=>x.hypothetical_net_ex_funding>0)
    .reduce((s,x)=>s+x.hypothetical_net_ex_funding,0);
 const losses=-rows.filter(x=>x.hypothetical_net_ex_funding<0)
    .reduce((s,x)=>s+x.hypothetical_net_ex_funding,0);
 const wins=rows.filter(x=>x.hypothetical_net_ex_funding>0).length;
 return {schema:'mahoraga-v107-paper-analytics-v1',capture_runs:runIds.size,
  paper_exit_labels:rows.length,missing_outcome_labels:unverified,pending_labels:pending,
  source_gaps:gaps,no_trade_labels:abstain,
  hypothetical_win_rate:rows.length?wins/rows.length:null,
  hypothetical_profit_factor_ex_funding:losses>0?gains/losses:null,
  hypothetical_mean_return_ex_funding:rows.length?
   rows.reduce((s,x)=>s+x.hypothetical_net_ex_funding,0)/rows.length:null,
  hypothetical_aggregate_simple_return_ex_funding:rows.length?
   rows.reduce((s,x)=>s+x.hypothetical_net_ex_funding,0):null,
  profit_after_funding_verified:false,actual_execution_verified:false,
  portfolio_profitability_verified:false,independent_external_attestation:false,
  cannot_infer_portfolio_drawdown:true,production_changed:false,
  approved_for_live:false,side_effects:false};
}
module.exports={summarize};
