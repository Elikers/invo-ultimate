/* INVO v6.5 — unified read-only research integrity and risk monitor. */
(function(){
'use strict';
const root=document.getElementById('v64Lab')||document.getElementById('v63Lab');if(!root)return;
const node=document.createElement('section');node.id='v65Lab';
node.innerHTML=`<style>
#v65Lab{margin:18px 0;padding:18px;background:#142638;color:#edf4ff;border:1px solid #426b86;border-radius:14px;font:13px/1.5 system-ui}
#v65Lab h3{margin:0 0 8px}#v65Lab p{color:#b4c9d9}
#v65Lab .tools{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:12px 0}
#v65Lab select,#v65Lab button{background:#182f46;color:#fff;border:1px solid #678da6;padding:8px;border-radius:8px}
#v65Lab .scroll{overflow:auto}#v65Lab table{width:100%;min-width:660px;border-collapse:collapse}
#v65Lab th,#v65Lab td{text-align:left;padding:9px;border-bottom:1px solid #35566a}
#v65Lab pre{white-space:pre-wrap;color:#d4e3eb;font:12px/1.5 system-ui}
</style>
<h3>🛡️ INVO Ultimate v6.5 — Research Integrity & Risk</h3>
<p>Consolidated historical sample, trading-cost and losing-streak screens, plus forward collection and freshness warnings. A historical screen is <strong>not</strong> a live profit recommendation.</p>
<div class="tools"><label>Market <select id="v65Market"><option>BTC</option><option>ETH</option><option>SOL</option><option>JUP</option></select></label><button id="v65Refresh" type="button">↻ Refresh research health</button></div>
<pre id="v65Health" role="status">Loading saved risk report…</pre>
<div class="scroll"><table><thead><tr><th>Strategy</th><th>Historical trades</th><th>8 bps net/trade</th><th>16 bps net/trade</th><th>Longest loss streak</th><th>Research screen</th></tr></thead><tbody id="v65Rows"></tbody></table></div>
<p>All risk statistics describe hypothetical individual-strategy trades, not a portfolio or live account. No execution occurs.</p>`;
root.insertAdjacentElement('afterend',node);
const $=id=>document.getElementById(id);
let report=null;
function fmt(x){return typeof x==='number'&&Number.isFinite(x)?x.toFixed(3):'N/A';}
function render(){
 $('v65Rows').replaceChildren();
 const m=report?.markets?.[$('v65Market').value];
 if(!report){$('v65Health').textContent='v6.5 risk report unavailable. No score is assumed.';return;}
 const delta=(Date.now()-Date.parse(report.created_utc))/60000;
 $('v65Health').textContent='Saved: '+report.created_utc+' UTC'+(delta>2160?' (STALE)':'')+' | Collector: '+(report.collector_heartbeat_utc||'NOT VERIFIED')+' | Forward summary: '+(report.forward_summary_utc||'MISSING')+' | Warnings: '+(report.flags?.join(', ')||'none');
 if(!m||m.status!=='ANALYZED'){$('v65Health').textContent+=' | Selected market unavailable: '+(m?.reason||'unknown');return;}
 for(const [id,x]of Object.entries(m.strategies||{})){
  const tr=$('v65Rows').insertRow();
  [id,x.closed_trades,fmt(x.net_8bps)+'%',fmt(x.net_16bps)+'%',x.risk?.max_consecutive_losses??'N/A',x.grade?.status||'UNKNOWN'].forEach(v=>{const td=tr.insertCell();td.textContent=String(v);});
 }
}
async function load(){
 $('v65Health').textContent='Reading research/integrity-risk.json…';
 try{
  const res=await fetch('research/integrity-risk.json?refresh='+Date.now(),{cache:'no-store'});
  if(!res.ok)throw Error('HTTP '+res.status);
  const v=await res.json();
  if(v.schema!=='invo-v6.5-integrity-risk-1')throw Error('Unexpected format');
  report=v;render();
 }catch(e){report=null;$('v65Rows').replaceChildren();$('v65Health').textContent='No verified saved v6.5 report: '+String(e.message||e);}
}
$('v65Market').addEventListener('change',render);
$('v65Refresh').addEventListener('click',load);
load();
})();

// Load read-only v6.6 market-intelligence panel.
(function(){const s=document.createElement('script');s.src='v66.js';s.defer=true;document.body.appendChild(s);})();
