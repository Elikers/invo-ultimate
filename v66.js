/* INVO v6.6 — Causal historical market regime research viewer. */
(function(){
'use strict';
const root=document.getElementById('v65Lab')||document.getElementById('v64Lab');
if(!root)return;
const el=document.createElement('section');el.id='v66Lab';
el.innerHTML=`<style>
#v66Lab{background:#142638;color:#f1f7fd;border:1px solid #537186;border-radius:14px;margin:20px 0;padding:17px;font:13px/1.5 system-ui}
#v66Lab p{color:#c1d4e3}#v66Lab .ctrl{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:12px 0}
#v66Lab select,#v66Lab button{background:#0d1c2a;border:1px solid #62849c;border-radius:8px;color:white;padding:9px}
#v66Lab .scroll{overflow-x:auto}#v66Lab table{border-collapse:collapse;min-width:660px;width:100%}
#v66Lab th,#v66Lab td{padding:9px;text-align:left;border-bottom:1px solid #38576a}
#v66Lab pre{font:12px/1.5 system-ui;color:#c7dced;white-space:pre-wrap}
</style>
<h3>🌐 INVO Ultimate v6.6 — Market Intelligence</h3>
<p>Historical descriptive market regimes from already completed five-minute candles. Regimes use fixed two-hour trend and range thresholds; they do <strong>not</strong> change signal decisions or establish an independently tested trading edge.</p>
<div class="ctrl"><label>Market <select id="v66Coin"><option>BTC</option><option>ETH</option><option>SOL</option><option>JUP</option></select></label>
<label>Strategy <select id="v66Strategy"><option value="fusion">Fusion</option><option value="sweep">Sweep</option><option value="auction">Auction</option><option value="pullback">Pullback</option><option value="volbreak">Volatility Breakout</option><option value="mean">Mean Reversion</option><option value="strict">Strict Fusion</option></select></label>
<label>Historical period <select id="v66Period"><option value="all">Entire 14-day sample</option><option value="0">First 50%</option><option value="1">Middle 25%</option><option value="2">Last 25%</option></select></label>
<button id="v66Refresh" type="button">↻ Refresh</button></div>
<pre id="v66Status" role="status">Checking historical regime research…</pre>
<div class="scroll"><table><thead><tr><th>Past-bar regime</th><th>Paper trades</th><th>Net expectancy (8 bps)</th><th>Profit factor</th><th>Sample check</th></tr></thead><tbody id="v66Rows"></tbody></table></div>
<pre id="v66Details"></pre>
<p>Stop-loss exits are <strong>not</strong> proof of a false breakout. Regime groups and historical periods are not independent tests. Do not select filters from this table and assume future profitability.</p>`;
root.insertAdjacentElement('afterend',el);
const $=id=>document.getElementById(id),fmt=x=>typeof x==='number'&&Number.isFinite(x)?x.toFixed(3):'N/A';
let report=null;
function render(){
 $('v66Rows').replaceChildren();
 const coin=$('v66Coin').value,id=$('v66Strategy').value,p=$('v66Period').value;
 const m=report?.markets?.[coin],x=m?.strategies?.[id];
 if(!x){$('v66Status').textContent='No validated saved market intelligence for '+coin+'/'+id; $('v66Details').textContent='';return;}
 const scope=p==='all'?x.entire_window:x.periods?.[Number(p)];
 if(!scope){$('v66Status').textContent='Selected historical period unavailable';return;}
 $('v66Status').textContent='Report: '+report.created_utc+' UTC · '+coin+' · '+id+' · '+(p==='all'?'Entire historical sample':scope.name)+' · No live/forward validation.';
 for(const [regime,summary] of Object.entries(scope.grouped||{})){
  const tr=$('v66Rows').insertRow();
  [regime,summary.count,fmt(summary.expectancyPct)+'%',fmt(summary.profitFactor),summary.sample_warning||'Historical subset only'].forEach(v=>{const td=tr.insertCell();td.textContent=String(v);});
 }
 $('v66Details').textContent='Stop-related exits: '+scope.stop_exit_count+' · Target exits: '+scope.target_exit_count+' · '+scope.caution+'\n'+
 'Overall historical 8 bps: '+(p==='all'?x.historical_trades:scope.total?.count)+' trades, '+(p==='all'?'see 6.4 diagnosis':fmt(scope.total?.expectancyPct)+'% net expectancy')+'\n'+x.risk_of_selection;
}
async function load(){
 $('v66Status').textContent='Loading saved market intelligence…';
 try{
  const response=await fetch('research/market-intelligence.json?ts='+Date.now(),{cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const data=await response.json();if(data.schema!=='invo-v6.6-market-intelligence-1')throw Error('Unrecognized report');
  report=data;render();
 }catch(e){report=null;$('v66Rows').replaceChildren();$('v66Details').textContent='';$('v66Status').textContent='Market intelligence unavailable: '+String(e.message||e);}
}
['v66Coin','v66Strategy','v66Period'].forEach(id=>$(id).addEventListener('change',render));
$('v66Refresh').addEventListener('click',load);load();
})();
