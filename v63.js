/* INVO Ultimate v6.3 — saved forward-only journal summary, no browser trades */
(function(){
'use strict';
const anchor=document.getElementById('v62Lab')||document.getElementById('v61Lab');if(!anchor)return;
const el=document.createElement('section');el.id='v63Lab';
el.innerHTML=`<style>
#v63Lab{background:linear-gradient(130deg,#112d37,#101d30);border:1px solid #396b78;border-radius:14px;padding:18px;margin:20px 0;color:#e3f6fb}
#v63Lab h3{margin:0 0 10px}#v63Lab p{color:#b8d5de;line-height:1.5;font-size:13px}
#v63Lab .v63-controls{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:13px 0}
#v63Lab select{background:#10212e;color:#fff;border:1px solid #437580;border-radius:8px;padding:9px}
#v63Lab table{border-collapse:collapse;width:100%;min-width:680px;font-size:12px}
#v63Lab th,#v63Lab td{padding:10px;text-align:left;border-bottom:1px solid #345966}
#v63Lab .v63-scroll{overflow-x:auto}#v63Lab pre{font:12px/1.5 system-ui;white-space:pre-wrap;color:#bddce5}
</style>
<h3>📡 INVO Ultimate v6.3 — Forward Observation Journal</h3>
<p><strong>Newly observed signals only.</strong> The GitHub collector checks completed 5-minute candles approximately every 15 minutes, subject to GitHub delays. Paper entry is deferred to a future candle; missed snapshots are not backfilled. The journal starts with zero forward trades. No exchange orders are placed.</p>
<div class="v63-controls">
<label>Market <select id="v63Market"><option>BTC</option><option>ETH</option><option>SOL</option><option>JUP</option></select></label>
<label>Assumed round-trip costs <select id="v63Cost"><option value="8">8 bps</option><option value="16">16 bps</option></select></label>
<button id="v63Refresh" type="button" class="secondary">↻ Refresh Forward Results</button>
</div>
<pre id="v63Status" role="status">Loading forward-only results…</pre>
<pre id="v63Health" role="status">Collector health: awaiting first lightweight scheduled run.</pre>
<div class="v63-scroll"><table><thead><tr><th>Strategy</th><th>Closed</th><th>Win rate</th><th>Net expectancy/trade</th><th>Profit factor</th><th>Max drawdown</th></tr></thead><tbody id="v63Rows"></tbody></table></div>
<p>All figures are simulated paper observations, not independently verified live fills. Too few closed trades means <strong>insufficient evidence</strong>. Results may be unavailable until the first scheduled observation run succeeds.</p>`;
anchor.insertAdjacentElement('afterend',el);
const $=id=>document.getElementById(id);
let report=null;
const num=x=>typeof x==='number'&&Number.isFinite(x)?x.toFixed(2):'N/A';
function render(){
 $('v63Rows').replaceChildren();
 const coin=$('v63Market').value,cost=$('v63Cost').value,m=report?.markets?.[coin];
 if(!report||!m){$('v63Status').textContent='No captured forward research yet for '+coin+'. No historical results will be substituted.';return;}
 const stamp=Date.parse(report.created_utc);
 const old=Number.isFinite(stamp)&&Date.now()-stamp>60*60000;
 $('v63Status').textContent='Forward started: '+report.started_utc+' · Last update: '+report.created_utc+(old?' (STALE)':'')+' · Closed '+m.closed+' / Pending '+m.pending+' / Open '+m.open+' / Unresolved gaps '+m.unresolved+' · Missed-window flags '+m.missed_runs+' · Data gaps '+m.gaps;
 const rows=m.by_cost_bps?.[cost]||{};
 for(const id of ['fusion','sweep','auction','pullback','volbreak','mean','strict']){
  const x=rows[id]||{},tr=$('v63Rows').insertRow();
  [id,x.count||0,num(x.winPct)+'%',num(x.expectancyPct)+'%',num(x.profitFactor),num(x.maxDrawdownPct)+'%'].forEach(v=>{const td=tr.insertCell();td.textContent=String(v);});
 }
}
async function health(){
 try{
  const response=await fetch('research/collector-health.json?cache='+Date.now(),{cache:'no-store'});
  if(!response.ok)throw Error('No saved 15-minute collector heartbeat yet');
  const j=await response.json();
  if(j.schema!=='invo-v6.3-collector-health-1')throw Error('Unknown collector status format');
  const age=(Date.now()-Date.parse(j.observed_utc))/60000;
  $('v63Health').textContent='Collector last observed: '+j.observed_utc+' UTC · '+j.processed_markets+'/'+j.expected_markets+' markets · '+(Number.isFinite(age)&&age>45?'STALE — scheduled runs may be stopped or delayed':'Latest saved collector run')+' · GitHub schedule is not guaranteed real-time.';
 }catch(e){$('v63Health').textContent='Collector heartbeat not yet verified: '+String(e.message||e);}
}
async function load(){
 health();
 $('v63Status').textContent='Loading saved forward journal summary…';
 try{
  const response=await fetch('research/forward-summary.json?cache='+Date.now(),{cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const data=await response.json();
  if(data.schema!=='invo-v6.3-forward-summary-1')throw Error('Unexpected format');
  report=data;render();
 }catch(e){report=null;$('v63Rows').replaceChildren();$('v63Status').textContent='Forward summary unavailable: '+String(e.message||e)+' (check GitHub Actions research workflow). No result is assumed.';}
}
$('v63Market').addEventListener('change',render);
$('v63Cost').addEventListener('change',render);
$('v63Refresh').addEventListener('click',load);
load();
})();

// Load v6.4 read-only loss-diagnosis panel.
(function(){const script=document.createElement('script');script.src='v64.js';script.defer=true;document.body.appendChild(script);})();
