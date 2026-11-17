/* INVO v6.9 Phase 4 read-only evidence dashboard — no order entry. */
(function(){
'use strict';
const old=document.getElementById('v68Lab');if(!old)return;
const section=document.createElement('section');section.id='v69Lab';
section.innerHTML=`<style>
#v69Lab{margin:18px 0;padding:18px;background:#13283d;color:#edf7ff;border:1px solid #678ba3;border-radius:14px;font:13px/1.6 system-ui}
#v69Lab p,#v69Lab small{color:#c4d5e2}#v69Lab h3{margin:0 0 8px}
#v69Lab .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:10px;margin:12px 0}
#v69Lab .kpi{background:#1b384f;padding:11px;border-radius:9px}
#v69Lab .value{font-size:20px;font-weight:700;color:white}
#v69Lab .scroll{overflow:auto}#v69Lab table{width:100%;min-width:670px;border-collapse:collapse}
#v69Lab th,#v69Lab td{text-align:left;padding:8px;border-bottom:1px solid #416076}
#v69Lab select,#v69Lab button{padding:8px;border-radius:8px;background:#1c4661;color:white;border:1px solid #88a9c2}
#v69Lab .toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
#v69Lab .alert{border-left:3px solid #ffb760;padding-left:10px;color:#ffe3ac}
</style>
<h3>🛡️ INVO v6.9 — Research Evidence &amp; Reliability</h3>
<p>Observed data quality is separate from workflow success. Net returns represent delayed paper examples with fixed illustrative costs, not broker fills.</p>
<div class="kpis">
 <div class="kpi"><small>Last checked market coverage</small><div class="value" id="v69Coverage">Loading</div></div>
 <div class="kpi"><small>Closed paper observations</small><div class="value" id="v69Closed">Loading</div></div>
 <div class="kpi"><small id="v69NetLabel">Pooled avg paper net (8 bps)</small><div class="value" id="v69Net">Loading</div></div>
 <div class="kpi"><small>Evidence gate</small><div class="value" id="v69Gate">Loading</div></div>
</div>
<div class="toolbar"><label>Market <select id="v69Coin"><option>BTC</option><option>ETH</option><option>SOL</option><option>JUP</option></select></label>
<label>Cost <select id="v69Cost"><option value="8">8 bps</option><option value="16">16 bps</option></select></label><button id="v69Refresh" type="button">Refresh</button></div>
<div class="scroll"><table><thead><tr><th>Strategy</th><th>Closed</th><th>Mean paper net</th><th>Worst paper net</th><th>Early vs late (pp)</th><th>Sample status</th></tr></thead><tbody id="v69Rows"></tbody></table></div>
<p class="alert" id="v69Notice" role="status">Loading research evidence...</p>
<small id="v69Stamp"></small>`;
old.insertAdjacentElement('afterend',section);
const $=id=>document.getElementById(id);
const format=x=>typeof x==='number'&&Number.isFinite(x)?x.toFixed(3)+'%':'N/A';
let state=null;
function render(){
 if(!state)return;
 const {forward,consistency,coverage}=state,cost=$('v69Cost').value,coin=$('v69Coin').value;
 $('v69Coverage').textContent=coverage?coverage.markets_with_current_completed_candle+'/'+coverage.total_markets:'Unknown';
 $('v69Closed').textContent=String(forward.aggregate?.closed??'Unknown');
 $('v69NetLabel').textContent='Pooled avg paper net ('+cost+' bps)';
 const pooled=forward.pooled_paper_cost_scenarios?.[cost];
 $('v69Net').textContent=format(pooled?.net_expectancy_pct);
 $('v69Gate').textContent=forward.overall_assessment==='FORWARD_SAMPLE_INSUFFICIENT'?'Insufficient':'Exploratory';
 const table=$('v69Rows');table.replaceChildren();
 for(const [name,group]of Object.entries(forward.markets?.[coin]?.groups||{})){
  const c=group.costs?.[cost],co=consistency?.markets?.[coin]?.strategies?.[name]?.by_cost_bps?.[cost];
  const cells=[name,group.closed,format(c?.forward?.net_expectancy_pct),format(c?.forward?.worst_net_pct),
   co?.last_minus_first_pct_points==null?'N/A':co.last_minus_first_pct_points.toFixed(3)+' pp',
   co?.assessment||'Unavailable'];
  const row=table.insertRow();cells.forEach(value=>{const cell=row.insertCell();cell.textContent=String(value)});
 }
 const flags=coverage?.flags||['COVERAGE_REPORT_NOT_AVAILABLE'];
 $('v69Notice').textContent=(flags.length?'Market-data checks: '+flags.join(', ')+'. ':'Market-data checks passed at last observation. ')+
  'Paper profitability and early/late differences are descriptive only; correlated overlapping trades, funding, slippage and execution are not validated.';
 $('v69Stamp').textContent='Forward evidence: '+(forward.created_utc||'unknown')+
  ' UTC · Coverage: '+(coverage?.checked_utc||'unavailable')+
  ' UTC · Consistency: '+(consistency?.created_utc||'unavailable')+' UTC';
}
async function load(){
 $('v69Notice').textContent='Loading saved JSON research evidence…';
 async function read(name){const r=await fetch('research/'+name+'.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error(name+': HTTP '+r.status);return r.json()}
 const results=await Promise.allSettled([read('forward-intelligence'),read('consistency'),read('collector-coverage')]);
 if(results[0].status!=='fulfilled'||results[0].value.schema!=='invo-v6.8-forward-intelligence-1'){
  $('v69Notice').textContent='Forward report unavailable; no profitability claims can be shown.';return;
 }
 const [forward,c,coverage]=results.map(r=>r.status==='fulfilled'?r.value:null);
 state={forward,consistency:c?.schema==='invo-v6.9-consistency-1'?c:null,
 coverage:coverage?.schema==='invo-v6.8.3-coverage-1'?coverage:null};
 render();
}
$('v69Coin').addEventListener('change',render);
$('v69Cost').addEventListener('change',render);
$('v69Refresh').addEventListener('click',load);
load().catch(e=>{$('v69Notice').textContent='Evidence request failed: '+String(e.message||e)});
})();
