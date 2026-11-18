'use strict';
const $=id=>document.getElementById(id);
const number=x=>Number.isFinite(x)?x.toLocaleString():'—';
const pct=x=>Number.isFinite(x)?(100*x).toFixed(3)+'%':'—';
$('file').addEventListener('change',async e=>{
 try{
  const f=e.target.files?.[0];if(!f)return;
  if(f.size>1000000)throw Error('File exceeds 1MB research view limit');
  const d=JSON.parse(await f.text());
  if(d.schema!=='mahoraga-v107-paper-analytics-v1'||d.approved_for_live!==false||
    d.portfolio_profitability_verified!==false||d.profit_after_funding_verified!==false||
    d.actual_execution_verified!==false)throw Error('Not a permitted paper-only summary');
  $('runs').textContent=number(d.capture_runs);$('labels').textContent=number(d.paper_exit_labels);
  $('mean').textContent=pct(d.hypothetical_mean_return_ex_funding);
  $('pf').textContent=number(d.hypothetical_profit_factor_ex_funding);
  $('missing').textContent=number(d.missing_outcome_labels+d.pending_labels);
  $('gaps').textContent=number(d.source_gaps);
  $('state').textContent='Read-only research summary displayed. Verify the underlying audit log separately.';
 }catch(err){$('state').textContent='Rejected: '+err.message;}
});
