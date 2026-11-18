import assert from 'node:assert/strict';
import worker,{decide,check} from './worker.mjs';
const now=Date.parse('2026-11-18T02:00:00Z');
const run=(min,event='schedule',status='completed',conclusion='success')=>({
 head_branch:'main',created_at:new Date(now-min*60000).toISOString(),event,status,conclusion});
assert.equal(decide([run(15)],now).reason,'RECENT_SUCCESS');
assert.equal(decide([run(65),run(2,'schedule','in_progress',null)],now).reason,'RESEARCH_IN_PROGRESS');
assert.equal(decide([run(65),run(15,'workflow_dispatch','completed','failure')],now).reason,'DISPATCH_COOLDOWN');
assert.equal(decide([run(65),run(3,'schedule','completed','failure')],now).reason,'RECENT_FAILURE_GRACE');
assert.equal(decide([run(70)],now).dispatch,true);
assert.equal(decide([],now).reason,'NO_RUN_HISTORY_FAIL_CLOSED');
assert.equal((await check({enabled:'false',now,fetchImpl:async()=>{throw Error('Unexpected fetch')}})).status,'DISABLED');
let reqs=[];const fetchImpl=async(url,options={})=>{
 reqs.push({url,options});
 if(url.endsWith('/dispatches'))return {status:204};
 return {ok:true,json:async()=>({workflow_runs:[run(80)]})};
};
assert.equal((await check({enabled:'true',token:'secret',fetchImpl,now})).status,'DISPATCH_REQUESTED');
assert.equal(reqs.length,2);
assert.equal(reqs[1].options.method,'POST');
assert.deepEqual(JSON.parse(reqs[1].options.body),{ref:'main',inputs:{collector_only:'true'}});
assert.equal((await worker.fetch()).status,404);
await assert.rejects(()=>check({enabled:'true',token:'secret',fetchImpl:async()=>({ok:false,status:403}),now}),/403/);
console.log('INVO v7.9 independent scheduler offline tests passed');
