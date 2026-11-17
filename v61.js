/* INVO Ultimate v6.1 — fixed-exit historical paper simulation UI */
(function(){
'use strict';
const $=id=>document.getElementById(id),C=window.INVOV61Core;
if(!C)return;
const root=$('v52Control')||$('v60Lab')||document.querySelector('.wrap')||document.body;
const panel=document.createElement('section');panel.id='v61Lab';panel.setAttribute('aria-label','v6.1 profitability validation');
panel.innerHTML=`
<style>
#v61Lab{margin:22px 0;padding:18px;background:linear-gradient(125deg,#14273b,#0d182a);border:1px solid #41647d;border-radius:14px;color:#e6effd}
#v61Lab h3{margin:0 0 10px;font-size:1.2rem}#v61Lab p{color:#b6cee4;line-height:1.5}
#v61Lab .v61-controls{display:flex;gap:12px;flex-wrap:wrap;align-items:end}
#v61Lab label{font-size:12px;display:flex;flex-direction:column;gap:5px;color:#b6cee4}
#v61Lab select,#v61Lab input{background:#0b1828;color:#fff;border:1px solid #3b607e;border-radius:7px;padding:9px;min-width:95px}
#v61Lab .v61-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0}
#v61Lab .v61-grid>div{padding:12px;background:#1b3047;border:1px solid #33526c;border-radius:10px}
#v61Lab .v61-grid span{display:block;font-size:12px;color:#b3c9da}#v61Lab .v61-grid b{font-size:20px}
#v61Lab .v61-scroll{overflow-x:auto}#v61Lab table{width:100%;min-width:680px;border-collapse:collapse;font-size:12px}
#v61Lab td,#v61Lab th{border-bottom:1px solid #35516a;padding:10px;text-align:left}
#v61Lab pre{white-space:pre-wrap;color:#c7dcf1;font:12px/1.5 system-ui}
@media(max-width:700px){#v61Lab .v61-grid{grid-template-columns:repeat(2,1fr)}}
</style>
<h3>📐 INVO Ultimate v6.1 — Net Profitability Validation</h3>
<p>Research-only fixed-rule simulations. 5-minute completed-candle signals, next-candle-open entry, fixed 1% stop / 1.5% target, 12-bar maximum hold, 8 bps illustrative round-trip fees and slippage. Stop wins when both exit levels touch the same candle; adverse stop gaps fill at the open. Trades never overlap. <strong>Funding, spread variation, latency and exchange execution are not modeled.</strong></p>
<div class="v61-controls">
<label>Market<select id="v61Coin"><option>BTC</option><option>ETH</option><option>SOL</option><option>JUP</option></select></label>
<label>Strategy<select id="v61Strategy"><option value="fusion">Fusion-inspired</option><option value="sweep">Liquidity Sweep</option><option value="auction">Auction Value-Area</option><option value="pullback">Trend Pullback</option><option value="volbreak">Volatility Breakout</option><option value="mean">Range Reversion</option><option value="strict">Strict MTF</option></select></label>
<label>Round-trip costs (bps)<input id="v61Cost" type="number" min="0" max="100" step="1" value="8"/></label>
<button id="v61Run" type="button">▶ Validate Closed Trades</button>
<button id="v61Export" type="button" disabled>↓ Export Trade Ledger</button>
<button id="v61Test" type="button" class="secondary">✓ Engine Self-Tests</button>
</div>
<div id="v61Metrics" class="v61-grid"><div><span>Completed trades</span><b>—</b></div><div><span>Net expectancy / trade</span><b>—</b></div><div><span>Net profit factor</span><b>—</b></div><div><span>Maximum drawdown</span><b>—</b></div></div>
<div class="v61-scroll"><table><thead><tr><th>Historical slice</th><th>Trades</th><th>Win %</th><th>Net expectancy %</th><th>Net profit factor</th><th>Max drawdown %</th><th>Compounded return %</th></tr></thead><tbody id="v61Rows"><tr><td colspan="7">Run validation to calculate results.</td></tr></tbody></table></div>
<pre id="v61Status" role="status">Ready. Run validation with recent available 5-minute history. No strategy is approved for real-money use.</pre>
`;
root.insertAdjacentElement('afterend',panel);
const actions=document.querySelector('#v52Control .v52-controls');
if(actions){
 const jump=document.createElement('button');
 jump.type='button';jump.id='v61Jump';jump.className='secondary';
 jump.textContent='📐 v6.1 Profitability Validation';
 jump.addEventListener('click',()=>panel.scrollIntoView({behavior:'smooth',block:'start'}));
 actions.prepend(jump);
}
let busy=false,last=[];
const fmt=(v,d=2)=>v===null||!Number.isFinite(v)?'N/A':v.toFixed(d);
const cell=s=>'<td>'+String(s)+'</td>';
function render(x){const f=x.full;
$('v61Metrics').innerHTML=[['Completed trades',String(f.count)],['Net expectancy / trade',fmt(f.expectancyPct)+'%'],['Net profit factor',fmt(f.profitFactor)],['Maximum drawdown',fmt(f.maxDrawdownPct)+'%']].map(v=>'<div><span>'+v[0]+'</span><b>'+v[1]+'</b></div>').join('');
$('v61Rows').innerHTML=[['First 70% history',x.early],['Last 30% history',x.late],['Combined (in-sample)',x.full]].map(([title,s])=>'<tr>'+[title,s.count,fmt(s.winPct),fmt(s.expectancyPct),fmt(s.profitFactor),fmt(s.maxDrawdownPct),fmt(s.compoundedPct)].map(cell).join('')+'</tr>').join('');}
function selfTests(){
 const b=Array.from({length:110},(_,i)=>({t:i*300000,o:100,h:100.2,l:99.8,c:100}));
 const sig=Array(b.length).fill(null);sig[65]={side:'LONG'};sig[66]={side:'LONG'};
 b[66]={...b[66],o:100,h:102,l:98,c:100};
 const a=C.simulate(b,sig),cost=C.simulate(b,sig,{costBps:20});
 const tests=[['stop-first same candle',a.length===1&&a[0].reason==='STOP_BOTH'],['fees reduce net return',Math.abs(a[0].netPct-cost[0].netPct-0.12)<1e-9],['no overlapping positions',a.length===1],['gap detection',C.valid(b)],['reject missing bars',!C.valid([b[0],b[2],...b.slice(3)])],['empty trade stats',C.summary([]).expectancyPct===null]];
 $('v61Status').textContent=tests.map(([name,pass])=>(pass?'PASS':'FAIL')+' — '+name).join('\n')+'\nThese are calculation self-tests, not profitable trading evidence.';
 return tests.every(x=>x[1]);
}
async function run(){
 if(busy)return;busy=true;$('v61Run').disabled=true;$('v61Export').disabled=true;last=[];
 try{
 if(!selfTests())throw Error('Self-tests failed');
 const eng=window.INVOV5Research,v=window.INVOV53Validation;if(!eng||!v)throw Error('v5.3 history or strategy engine unavailable');
 const coin=$('v61Coin').value,strategy=$('v61Strategy').value,cost=Number($('v61Cost').value);
 if(!Number.isFinite(cost)||cost<0||cost>100)throw Error('Round-trip cost must be 0–100 bps');
 if(!v.getResults().some(x=>x.coin===coin&&!x.error)){
  $('v61Status').textContent='Loading shared history from the existing scanner…';await v.run();
 }
 const bars=v.getPeriodBars(coin,14)||v.getPeriodBars(coin,7);
 if(!bars||!C.valid(bars))throw Error('Continuous 5-minute history unavailable; no backtest will be reported');
 const signals=Array(bars.length).fill(null);
 for(let i=65;i+12<bars.length;i++){
  const s=eng.signal(strategy,bars.slice(Math.max(0,i-900),i+1));
  signals[i]=s&&s.side?s:null;
  if(i%120===0){$('v61Status').textContent='Evaluating completed candles: '+i+' / '+bars.length+'…';await new Promise(r=>setTimeout(r,0));}
 }
 last=C.simulate(bars,signals,{stopPct:1,targetPct:1.5,costBps:cost,hold:12});
 const verdict=C.validate(bars,last);render(verdict);$('v61Export').disabled=!last.length;
 $('v61Status').textContent=verdict.status+'\n'+coin+' / '+strategy+' · '+bars.length+' continuous candles · '+last.length+' non-overlapping paper trades. Early/late periods belong to the same historical window, not an independent forward test. Fixed settings were not optimized. Results exclude funding and real fill uncertainty. Do not trade real funds based on this screen.';
 }catch(e){$('v61Status').textContent='Validation unavailable: '+String(e.message||e);}finally{busy=false;$('v61Run').disabled=false;}
}
function exportCsv(){if(!last.length)return;
 const names=['utc_signal_time','side','entry','exit','exit_reason','gross_pct','net_pct','signal_bar','entry_bar','exit_bar'];
 const lines=[names,...last.map(t=>[new Date(t.time).toISOString(),t.side,t.entry,t.exit,t.reason,t.grossPct,t.netPct,t.signalIndex,t.entryIndex,t.exitIndex])].map(a=>a.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');
 const u=URL.createObjectURL(new Blob([lines],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download='INVO_v6_1_hypothetical_trades_'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);
}
$('v61Run').addEventListener('click',run);$('v61Export').addEventListener('click',exportCsv);$('v61Test').addEventListener('click',selfTests);
window.INVOV61={run,selfTests,getTrades:()=>last.slice()};
})();

// v6.2 read-only report panel; old v6.1 calculations remain unchanged.
(function(){const s=document.createElement('script');s.src='v62.js';s.defer=true;document.body.appendChild(s);})();
