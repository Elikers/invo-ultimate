/* INVO Ultimate v6.4 — Historical loss diagnosis panel; no automatic strategy updates. */
(function(){
'use strict';
const anchor=document.getElementById('v63Lab')||document.getElementById('v62Lab');if(!anchor)return;
const panel=document.createElement('section');panel.id='v64Lab';
panel.innerHTML=`<style>
#v64Lab{margin:18px 0;padding:18px;background:linear-gradient(125deg,#152638,#13202e);border:1px solid #526777;border-radius:14px;color:#e5effc}
#v64Lab h3{margin:0 0 9px}#v64Lab p{color:#b8cddd;line-height:1.5;font-size:13px}
#v64Lab .v64-controls{display:flex;gap:10px;flex-wrap:wrap;align-items:end;margin:12px 0}
#v64Lab label{display:flex;flex-direction:column;gap:5px;font-size:12px}
#v64Lab select{background:#0e1a28;color:#fff;border:1px solid #537187;border-radius:7px;padding:9px}
#v64Lab button{padding:9px}#v64Lab pre{white-space:pre-wrap;font:12px/1.5 system-ui;color:#bdd4eb}
#v64Lab .v64-scroll{overflow:auto}#v64Lab table{width:100%;min-width:610px;border-collapse:collapse;font-size:12px}
#v64Lab th,#v64Lab td{padding:9px;text-align:left;border-bottom:1px solid #3c536a}
</style>
<h3>🔬 INVO Ultimate v6.4 — Rapid Loss Diagnosis</h3>
<p>Historical-only analysis using the original seven website strategy signals and the v6.1 next-candle-open paper accounting model. Compares 0, 8, 16 and 24 bps round-trip costs; break-even fee threshold; stop/target/time exits; and long/short contributions. No automatic tuning, new signal rules, or real-money orders.</p>
<div class="v64-controls">
<label>Market<select id="v64Coin"><option>BTC</option><option>ETH</option><option>SOL</option><option>JUP</option></select></label>
<label>Strategy<select id="v64Strategy"><option value="fusion">Fusion</option><option value="sweep">Liquidity Sweep</option><option value="auction">Auction</option><option value="pullback">Trend Pullback</option><option value="volbreak">Volatility Breakout</option><option value="mean">Mean Reversion</option><option value="strict">Strict Fusion</option></select></label>
<button type="button" id="v64Refresh">↻ Load Diagnosis</button>
</div>
<pre id="v64Status" role="status">Loading saved loss diagnosis…</pre>
<div class="v64-scroll"><table><thead><tr><th>Cost scenario</th><th>Completed trades</th><th>Net expectancy</th><th>Profit factor</th><th>Max drawdown</th></tr></thead><tbody id="v64Rows"></tbody></table></div>
<pre id="v64Reasons"></pre><p><strong>Research only:</strong> these historical windows overlap previous backtests. A positive result does not establish an independently forward-validated trading edge.</p>`;
anchor.insertAdjacentElement('afterend',panel);
const $=id=>document.getElementById(id);let report=null;
const fmt=x=>typeof x==='number'&&Number.isFinite(x)?x.toFixed(3):'N/A';
function render(){
 $('v64Rows').replaceChildren();
 const coin=$('v64Coin').value,id=$('v64Strategy').value,m=report?.markets?.[coin],x=m?.strategies?.[id];
 if(!x){$('v64Status').textContent='No saved historical diagnosis available for '+coin+'/'+id+'.';$('v64Reasons').textContent='';return;}
 $('v64Status').textContent='Report: '+report.created_utc+' UTC · '+coin+'/'+id+' · '+x.status+' · Break-even round-trip cost '+fmt(x.break_even_round_trip_cost_bps)+' bps (historical mean, not a fee recommendation).';
 for(const c of ['0','8','16','24']){
  const y=x.stress_bps?.[c]||{},r=$('v64Rows').insertRow();
  [c+' bps',y.count??0,fmt(y.expectancyPct)+'%',fmt(y.profitFactor),fmt(y.maxDrawdownPct)+'%'].forEach(v=>{const td=r.insertCell();td.textContent=String(v);});
 }
 const exits=Object.entries(x.exit_reasons||{}).map(([name,val])=>name+': '+val.count+' trades, avg gross '+fmt(val.avg_gross_pct)+'%').join(' · ');
 const sides=['LONG','SHORT'].map(side=>side+': '+(x.side?.[side]?.count||0)+' trades, 8 bps net expectancy '+fmt(x.side?.[side]?.expectancyPct)+'%').join(' | ');
 $('v64Reasons').textContent='Exit reasons: '+(exits||'none')+'\n'+sides+'\nPeriods (8 bps): '+(x.period||[]).map(y=>y.name+' '+y.count+' trades, '+fmt(y.expectancyPct)+'% net').join(' | ');
}
async function load(){
 $('v64Status').textContent='Loading research/loss-diagnosis.json…';
 try{const response=await fetch('research/loss-diagnosis.json?cache='+Date.now(),{cache:'no-store'});
 if(!response.ok)throw Error('HTTP '+response.status);
 const data=await response.json();if(data.schema!=='invo-v6.4-loss-diagnosis-1')throw Error('Unexpected report format');report=data;render();
 }catch(e){report=null;$('v64Rows').replaceChildren();$('v64Reasons').textContent='';$('v64Status').textContent='Report not available: '+String(e.message||e)+' — check INVO GitHub Actions; no results are assumed.';}
}
$('v64Coin').addEventListener('change',render);$('v64Strategy').addEventListener('change',render);$('v64Refresh').addEventListener('click',load);load();
})();

// Load v6.5 unified read-only integrity and risk dashboard.
(function(){const script=document.createElement('script');script.src='v65.js';script.defer=true;document.body.appendChild(script);})();
