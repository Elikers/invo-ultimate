/* INVO v6.7 — read-only operational quality monitor and improvement tracker. */
(function(){
'use strict';
const root=document.getElementById('v66Lab')||document.getElementById('v65Lab');if(!root)return;
const el=document.createElement('section');el.id='v67Lab';
el.innerHTML=`<style>
#v67Lab{margin:18px 0;padding:18px;border-radius:14px;background:#122438;border:1px solid #5b7790;color:#ebf5ff;font:13px/1.5 system-ui}
#v67Lab h3{margin:0 0 8px}#v67Lab p{color:#c2d4e1}
#v67Lab button{background:#1a3954;color:white;border:1px solid #6885a0;border-radius:8px;padding:8px}
#v67Lab table{width:100%;border-collapse:collapse;font-size:12px}#v67Lab td,#v67Lab th{border-bottom:1px solid #35516c;padding:8px;text-align:left}
#v67Lab .scroll{overflow-x:auto}#v67Lab pre{font:12px/1.5 system-ui;white-space:pre-wrap;color:#d0e4f6}
</style>
<h3>🧰 INVO Ultimate v6.7 — Operations & Development Tracker</h3>
<p>Collection provenance, freshness, archival status, and improvement verification. This is research infrastructure, not live trading.</p>
<button type="button" id="v67Refresh">↻ Refresh operations</button>
<pre role="status" id="v67Health">Loading operational report…</pre>
<div class="scroll"><table><thead><tr><th>Priority</th><th>Improvement</th><th>Development status</th><th>Next check</th></tr></thead><tbody id="v67Rows"></tbody></table></div>
<p>Scheduled execution is only verified when the saved collector trigger says <strong>schedule</strong>. Running the collector during a code push does not prove recurring execution. Historical data is never counted as observed forward paper trades.</p>`;
root.insertAdjacentElement('afterend',el);
const $=id=>document.getElementById(id);
async function load(){
 $('v67Health').textContent='Loading saved operations and improvement status…';$('v67Rows').replaceChildren();
 try{
  const fetchJson=async path=>{const r=await fetch(path+'?v='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error(path+': HTTP '+r.status);return r.json();};
  const [ops,tracker]=await Promise.all([fetchJson('research/operations-health.json'),fetchJson('research/improvements.json')]);
  if(ops.schema!=='invo-v6.7-operations-1'||tracker.schema!=='invo-v6.7-improvement-tracker-1')throw Error('Unexpected report schema');
  const age=(Date.now()-Date.parse(ops.collector_utc))/60000;
  $('v67Health').textContent='Watchdog: '+ops.checked_utc+' UTC · Latest collector: '+(ops.collector_utc||'MISSING')+
   ' · Trigger: '+ops.collector_trigger+' · Collector age: '+(Number.isFinite(age)?Math.round(age)+' min':'unknown')+
   ' · Verified scheduled latest run: '+(ops.last_run_scheduled?'YES':'NO')+
   ' · Forward paper closed: '+ops.forward_closed_paper+' · Warnings: '+(ops.flags?.join(', ')||'none');
  for(const item of tracker.items||[]){
   const tr=$('v67Rows').insertRow();
   [item.priority,item.title,item.status,item.next_check].forEach(x=>{const td=tr.insertCell();td.textContent=x||'';});
  }
 }catch(e){$('v67Health').textContent='No validated v6.7 operations report: '+String(e.message||e);}
}
$('v67Refresh').addEventListener('click',load);load();
})();

// Load read-only v6.8 forward evidence intelligence.
(function(){const s=document.createElement('script');s.src='v68.js';s.defer=true;document.body.appendChild(s);})();
