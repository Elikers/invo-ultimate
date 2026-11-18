'use strict';
const fs=require('node:fs');
function safe(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function render(data){
 if(data?.schema!=='mahoraga-v107-readonly-analytics-v1'||
   data.auto_promotion!==false||data.live_orders!==false||
   data.full_cost_forward_profitability!==null||data.live_account_return!==null)
   throw Error('Unsafe/unsupported dashboard source');
 const cell=(x)=>x===null?'Unavailable':safe(x);
 const rows=['BTC','ETH','SOL'].map(m=>{
   const x=data.markets[m];
   return '<tr><th>'+m+'</th><td>'+cell(x.observations)+'</td><td>'+cell(x.no_trade)+'</td><td>'+cell(x.pending)+'</td><td>'+cell(x.missing)+'</td><td>'+cell(x.reference_only_labels)+'</td><td>'+ (x.reference_net_ex_funding===null?'Not available':safe((x.reference_net_ex_funding*100).toFixed(5))+'%')+'</td><td>NOT VERIFIED</td></tr>';
 }).join('\n');
 return '<!doctype html>\n<html lang="en"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MAHORAGA Research Intelligence</title>'+
 '<style>body{margin:0;background:#0d1727;color:#f5f7fb;font:16px system-ui,-apple-system,sans-serif}main{max-width:1050px;margin:40px auto;padding:20px}h1{font-size:34px}p{line-height:1.55;color:#c6d4e5}.kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin:26px 0}.tile{border:1px solid #334862;border-radius:14px;background:#18283d;padding:20px}strong{display:block;font-size:30px}small{color:#9bb3c8}.scroll{overflow-x:auto}table{border-collapse:collapse;width:100%;min-width:760px;background:#162338}th,td{text-align:left;border-bottom:1px solid #31475f;padding:13px}th{color:#d9e5f4}.note{border-left:3px solid #ffba66;padding-left:15px;margin-top:32px}</style>'+
 '<main><p>RESEARCH ONLY · NO ORDERS · NO AUTOMATIC PROMOTION</p><h1>MAHORAGA Forward Evidence</h1>'+
 '<p>Generated '+safe(data.generated_at_utc)+'. Nothing on this page is a live account result or investment signal.</p>'+
 '<section class="kpi"><div class="tile"><small>Verified causal reports loaded</small><strong>'+cell(data.evidence_reports_count)+'</strong></div>'+
 '<div class="tile"><small>Source capture gaps</small><strong>'+cell(data.source_gaps)+'</strong></div>'+
 '<div class="tile"><small>Research challenger revision</small><strong>'+cell(data.challenger_revision)+'</strong></div>'+
 '<div class="tile"><small>Fully costed forward profit</small><strong>Unknown</strong></div></section>'+
 '<div class="scroll"><table><thead><tr><th>Market</th><th>Observations</th><th>No trade</th><th>Pending</th><th>Missing</th><th>Paper reference labels</th><th>Mean ex funding</th><th>Profitability</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
 '<p class="note">Data state: '+safe(data.data_origin)+'. Reference-only returns, if present, use hypothetical bid/ask and fees, exclude unverified funding and are NOT net investable profit. No independent forward model has been approved.</p>'+
 '<p>Automatic scheduler: '+(data.automated_scheduler_active?'YES':'NOT VERIFIED')+' · Independent backup: '+(data.independent_offsite_backup_verified?'YES':'NOT VERIFIED')+' · Live trading: BLOCKED</p></main></html>\n';
}
if(require.main===module){
 const file=process.argv[2],out=process.argv[3];
 if(!file||!out)throw Error('Usage: node dashboard.cjs input-analytics.json dashboard.html');
 fs.writeFileSync(out,render(JSON.parse(fs.readFileSync(file,'utf8'))));
 console.log('Generated read-only research HTML, no orders or website deployment');
}
module.exports={render};
