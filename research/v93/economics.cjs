'use strict';
/* v9.3: fee and cashflow evidence gate; no imaginary executable trading profits. */
const FIELDS=['entry_fee_bps','exit_fee_bps','spread_bps','slippage_bps','funding_bps'];
function economics(grossTrades,costs,receipts){
 if(!Array.isArray(grossTrades)||!costs||typeof costs!=='object')throw Error('Missing hypothetical ledger');
 for(const f of FIELDS)if(!Number.isFinite(costs[f])||costs[f]<0)throw Error('Invalid/missing '+f);
 const total=FIELDS.reduce((s,f)=>s+costs[f],0);
 const validSource=FIELDS.every(f=>receipts?.[f]?.verified===true&&
  typeof receipts[f]?.document_id==='string'&&receipts[f].document_id.length>3);
 if(grossTrades.some(x=>!Number.isFinite(x?.gross_pct)||!['LONG','SHORT'].includes(x.side)||
  !Number.isFinite(x.entry)||x.entry<=0||!Number.isFinite(x.exit)||x.exit<=0))
  throw Error('Unverified gross trade');
 const mean=grossTrades.length?grossTrades.reduce((s,x)=>s+x.gross_pct-total/100,0)/grossTrades.length:null;
 return {schema:'invo-v9.3-hypothetical-economics-1',trade_count:grossTrades.length,
  total_cost_bps:total,mean_simulated_net_pct:mean,
  cost_evidence:validSource?'SOURCE_DOCUMENT_IDS_SUPPLIED_NOT_AUDITED':'ASSUMPTION_ONLY',
  actual_exchange_trades_verified:false,actual_account_pnl:null,
  warnings:['Source IDs are caller assertions and not independently audited; verified account receipts would require separate reconciliation.',
   'Flat funding bps is not actual accrual; order fills, spread, and market impact may differ.',
   'Repricing identical fixed fills cannot substantiate real-money returns or a new profitable strategy.']};
}
module.exports={FIELDS,economics};
