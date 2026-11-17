/* INVO v6.8 forward-only analysis viewer; no execution or signal alteration. */
(function(){
'use strict';
const root=document.getElementById('v67Lab')||document.getElementById('v66Lab');if(!root)return;
const node=document.createElement('section');node.id='v68Lab';
node.innerHTML=`<style>
#v68Lab{margin:18px 0;padding:18px;background:#13273b;color:#eaf6ff;border:1px solid #597f99;border-radius:14px;font:13px/1.55 system-ui}
#v68Lab p,#v68Lab small{color:#bcd1e3}#v68Lab .controls{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:12px 0}
#v68Lab select,#v68Lab button{padding:8px;color:#fff;background:#1e4059;border:1px solid #6f9cb5;border-radius:8px}
#v68Lab .scroll{overflow-x:auto}#v68Lab table{width:100%;min-width:700px;border-collapse:collapse}
#v68Lab th,#v68Lab td{padding:8px;border-bottom:1px solid #34536c;text-align:left}
#v68Lab pre{white-space:pre-wrap;font:12px/1.5 system-ui;color:#cbdfe9}
</style>
<h3>📊 INVO Ultimate v6.8 — Forward Evidence Intelligence</h3>
<p>Only genuinely captured delayed <strong>paper</strong> trades. Historical comparisons and win-frequency intervals are descriptive; none is proof of tradable profitability.</p>
<div class="controls">
<label>Market <select id="v68Coin"><option>BTC</option><option>ETH</option><option>SOL</option><option>JUP</option></select></label>
<label>Assumed round-trip cost <select id="v68Cost"><option value="8">8 bps</option><option value="16">16 bps</option></select></label>
<button id="v68Refresh" type="button">↻ Refresh saved evidence</button></div>
<pre id="v68Status" role="status">Loading new forward report…</pre>
<div class="scroll"><table><thead><tr><th>Strategy</th><th>Closed / Open / Pending</th><th>Forward avg net</th><th>Historical last-quarter avg net</th><th>Gap (percentage points)</th><th>Evidence status</th></tr></thead><tbody id="v68Rows"></tbody></table></div>
<pre id="v68Notes"></pre>
<p>No strategies are promoted or modified by this panel. Full cost, funding, spread, liquidity, execution and independence uncertainties remain.</p>`;
root.insertAdjacentElement('afterend',node);
const $=id=>document.getElementById(id),fmt=x=>typeof x==='number'&&Number.isFinite(x)?x.toFixed(3)+'%':'N/A';
let report=null;
function render(){
 $('v68Rows').replaceChildren();
 const coin=$('v68Coin').value,cost=$('v68Cost').value;
 const m=report?.markets?.[coin];
 if(!m){$('v68Status').textContent='No verified v6.8 report for selected market';return;}
 $('v68Status').textContent='Saved: '+report.created_utc+' UTC · Historical reference: '+(report.historical_report_utc||'missing')+
 ' · Closed paper trades across all markets: '+report.aggregate.closed+' · '+report.overall_assessment;
 for(const [id,v]of Object.entries(m.groups||{})){
  const c=v.costs?.[cost],tr=$('v68Rows').insertRow();
  [id,v.closed+' / '+v.open+' / '+v.pending,fmt(c?.forward?.net_expectancy_pct),
   fmt(c?.reference?.expectancy_pct),fmt(c?.difference_pct),c?.assessment||'UNAVAILABLE'].forEach(t=>{let td=tr.insertCell();td.textContent=String(t);});
 }
 $('v68Notes').textContent='Minimum group: '+report.required_samples.min_closed_per_strategy_market+
 ' closed paper trades. Overall exploratory minimum: '+report.required_samples.min_closed_total+
 '. These are evidence gates, not guarantees.\n'+report.warnings.join('\n');
}
async function load(){
 $('v68Status').textContent='Loading saved report…';
 try{
  const r=await fetch('research/forward-intelligence.json?t='+Date.now(),{cache:'no-store'});
  if(!r.ok)throw Error('HTTP '+r.status);
  const v=await r.json();if(v.schema!=='invo-v6.8-forward-intelligence-1')throw Error('Unexpected schema');
  report=v;render();
 }catch(e){report=null;$('v68Rows').replaceChildren();$('v68Status').textContent='v6.8 forward report unavailable: '+String(e.message||e);}
}
$('v68Coin').addEventListener('change',render);$('v68Cost').addEventListener('change',render);
$('v68Refresh').addEventListener('click',load);load();
})();
