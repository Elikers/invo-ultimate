/* INVO Ultimate v6.2 — read-only daily automated research reports */
(function(){
'use strict';
const anchor=document.getElementById('v61Lab')||document.getElementById('v52Control');
if(!anchor)return;
const el=document.createElement('section');el.id='v62Lab';
el.innerHTML=`<style>
#v62Lab{background:linear-gradient(140deg,#132c40,#0b192c);border:1px solid #466781;border-radius:15px;padding:19px;margin:16px 0;color:#e6efff}
#v62Lab h3{margin:0 0 8px}#v62Lab p{line-height:1.5;color:#b4cbe3;font-size:13px}
#v62Lab .v62-tools{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:12px 0}
#v62Lab select{background:#0d1c2c;color:#e6f3fc;border:1px solid #466781;border-radius:8px;padding:9px}
#v62Lab .v62-scroll{overflow-x:auto}#v62Lab table{border-collapse:collapse;min-width:700px;width:100%;font-size:12px}
#v62Lab td,#v62Lab th{border-bottom:1px solid #35516a;padding:9px;text-align:left}
#v62Lab pre{font:12px/1.5 system-ui;white-space:pre-wrap;color:#c0d6ef}
</style>
<h3>🤖 INVO Ultimate v6.2 — Automated Research Monitor</h3>
<p>Scheduled GitHub research. Seven existing signal strategies, completed Hyperliquid 5-minute candles and our conservative v6.1 paper trade accounting. Fixed 8 / 16 bps cost scenarios; 50% / 25% / 25% chronological slices with a 12-bar boundary embargo. <strong>Historical tests are not independent forward validation or live trade results.</strong></p>
<div class="v62-tools"><label>Market <select id="v62Market"><option>BTC</option><option>ETH</option><option>SOL</option><option>JUP</option></select></label>
<label>Round-trip costs <select id="v62Costs"><option value="8">8 bps</option><option value="16">16 bps</option></select></label>
<button id="v62Refresh" class="secondary" type="button">↻ Load Saved Research</button></div>
<pre role="status" id="v62Status">Loading latest saved automated report…</pre>
<div class="v62-scroll"><table><thead><tr><th>Strategy</th><th>Trades, all folds</th><th>First 50% net expectancy</th><th>Middle 25% net expectancy</th><th>Last 25% net expectancy</th><th>Last profit factor</th><th>Research screen</th></tr></thead>
<tbody id="v62Rows"><tr><td colspan="7">No verified report loaded.</td></tr></tbody></table></div>
<p>Missing/unavailable markets display no results. Scheduled output is published only when at least one continuous market history validates. Results use fixed rules; no strategy is automatically promoted or connected to real trading.</p>`;
anchor.insertAdjacentElement('afterend',el);
const $=id=>document.getElementById(id);
let report=null;
const fmt=x=>typeof x==='number'&&Number.isFinite(x)?x.toFixed(3):'N/A';
function render(){
 const market=$('v62Market').value,cost=Number($('v62Costs').value);
 $('v62Rows').replaceChildren();
 if(!report){$('v62Status').textContent='No saved report yet. The research workflow must finish successfully first.';return;}
 const data=report.markets?.[market];
 const created=Date.parse(report.created_utc),age=Date.now()-created;
 $('v62Status').textContent='Research recorded: '+report.created_utc+' UTC · '+(Number.isFinite(age)&&age>36*3600000?'STALE REPORT (older than 36 hours)':'Saved run')+' · '+market+': '+(data?.status||'UNAVAILABLE')+(data?.reason?' · '+data.reason:'');
 const items=(data?.results||[]).filter(x=>x.cost_bps_round_trip===cost);
 if(!items.length){const tr=$('v62Rows').insertRow();const td=tr.insertCell();td.colSpan=7;td.textContent='No validated results for this market and cost scenario.';return;}
 for(const x of items){const f=x.folds||[];const tr=$('v62Rows').insertRow();
 const vals=[x.strategy,x.trade_count,...[0,1,2].map(i=>fmt(f[i]?.expectancyPct)+'%'),fmt(f[2]?.profitFactor),x.screen];
 vals.forEach(v=>{const td=tr.insertCell();td.textContent=String(v);});
 }
}
async function load(){
 $('v62Status').textContent='Checking saved GitHub research…';
 try{
  const response=await fetch('research/latest.json?cache='+Date.now(),{cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status+' — report may not have been generated yet');
  const data=await response.json();
  if(data.schema!=='invo-v6.2-research-1'||!data.created_utc||!data.markets)throw Error('Unknown or incomplete report schema');
  report=data;render();
 }catch(e){report=null;$('v62Rows').replaceChildren();$('v62Status').textContent='Research report unavailable: '+String(e.message||e)+'. Check GitHub Actions → INVO v6.2 Automated Paper Research. No results are assumed.';}
}
$('v62Refresh').addEventListener('click',load);
$('v62Market').addEventListener('change',render);
$('v62Costs').addEventListener('change',render);
load();
})();

// Load the separate read-only v6.3 journal panel.
(function(){const s=document.createElement('script');s.src='v63.js';s.defer=true;document.body.appendChild(s);})();
