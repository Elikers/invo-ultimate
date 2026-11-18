/*
 * INVO v7.9: proposed independent Cloudflare Cron recovery of an existing
 * collector-only GitHub workflow. Disabled until owner deploys and enables.
 * No public HTTP trigger, no production strategy edits, no order placement.
 */
const WORKFLOW_URL='https://api.github.com/repos/Elikers/invo-ultimate/actions/workflows/research.yml';
const HEADERS={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'INVO-collector-recovery-v7.9'};
const MIN=60000,STALE=50*MIN,COOLDOWN=60*MIN,GRACE=15*MIN;
export function decide(runs,now=Date.now()){
 if(!Array.isArray(runs)||!Number.isFinite(now))throw Error('Invalid run input');
 const valid=runs.filter(r=>r?.head_branch==='main'&&Number.isFinite(Date.parse(r.created_at))
  &&Date.parse(r.created_at)<=now).sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));
 const age=r=>now-Date.parse(r.created_at);
 const recentSuccess=valid.find(r=>r.status==='completed'&&r.conclusion==='success');
 const pending=valid.find(r=>['queued','in_progress','waiting','pending','requested'].includes(r.status)&&age(r)<STALE);
 const dispatch=valid.find(r=>r.event==='workflow_dispatch'&&age(r)<COOLDOWN);
 const recentFailure=valid.find(r=>r.status==='completed'&&r.conclusion==='failure'&&age(r)<GRACE);
 if(recentSuccess&&age(recentSuccess)<=STALE)return {dispatch:false,reason:'RECENT_SUCCESS'};
 if(pending)return {dispatch:false,reason:'RESEARCH_IN_PROGRESS'};
 if(dispatch)return {dispatch:false,reason:'DISPATCH_COOLDOWN'};
 if(recentFailure)return {dispatch:false,reason:'RECENT_FAILURE_GRACE'};
 if(!valid.length)return {dispatch:false,reason:'NO_RUN_HISTORY_FAIL_CLOSED'};
 return {dispatch:true,reason:'COLLECTOR_STALE',last_successful_run_utc:recentSuccess?.created_at??null};
}
export async function check({fetchImpl,token,enabled,now=Date.now()}){
 if(enabled!=='true')return {status:'DISABLED'};
 if(!token)return {status:'MISSING_SECRET'};
 const url=WORKFLOW_URL+'/runs?branch=main&per_page=100';
 const response=await fetchImpl(url,{headers:{...HEADERS,Authorization:'Bearer '+token}});
 if(!response.ok)throw Error('GitHub run-history HTTP '+response.status);
 const obj=await response.json();
 if(!Array.isArray(obj.workflow_runs))throw Error('Malformed workflow history');
 const decision=decide(obj.workflow_runs,now);
 if(!decision.dispatch)return {status:'SKIPPED',reason:decision.reason};
 // The workflow_dispatch endpoint can queue collector_only; no full research, no orders.
 const out=await fetchImpl(WORKFLOW_URL+'/dispatches',{
   method:'POST',headers:{...HEADERS,Authorization:'Bearer '+token,'Content-Type':'application/json'},
   body:JSON.stringify({ref:'main',inputs:{collector_only:'true'}})});
 if(out.status!==204)throw Error('GitHub collector-only dispatch HTTP '+out.status);
 return {status:'DISPATCH_REQUESTED',reason:decision.reason,
   warning:'GitHub accepted the request; this does not prove execution or repair missed signals.'};
}
export default {
 async fetch(){return new Response('Not Found',{status:404});},
 async scheduled(event,env,ctx){
   ctx.waitUntil((async()=>{
     try {
       const result=await check({fetchImpl:fetch,token:env.GITHUB_ACTIONS_TOKEN,
         enabled:env.RECOVERY_ENABLED,now:Date.now()});
       console.log(JSON.stringify(result));
     }catch(error){
       // No authorization token, request bodies or URLs are logged.
       console.error('INVO_EXTERNAL_RECOVERY_ERROR',String(error.message||error).slice(0,180));
       throw error;
     }
   })());
 }
};
