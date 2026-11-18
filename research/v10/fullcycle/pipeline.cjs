'use strict';
// Research-only integration: validated public events -> pre-outcome shadow decision.
// No order APIs, website mutation, or retrospective relabeling.
const path=require('node:path'),fs=require('node:fs');
const C=require('../next/capture.cjs'),F=require('./features.cjs'),
 D=require('./decisions.cjs'),L=require('./multi-ledger.cjs'),T=require('./train.cjs');
function loadCapture(dir){
 if(!path.isAbsolute(dir))throw Error('Absolute capture directory required');
 // Full replay and source linkage verified before returning accepted events.
 const replay=C.open(dir,'fullcycle-read-verify');
 const events=C.read(replay.files.events);
 return {events,health:replay.health()};
}
function readLedger(file){
 if(!fs.existsSync(file))return [];
 const b=fs.readFileSync(file,'utf8');if(b&&!b.endsWith('\n'))throw Error('Torn forward evidence');
 const rows=b.trim()?b.trim().split('\n').map(JSON.parse):[];
 L.verify(rows);return rows;
}
function observeMarket(dir,market,now,models={},predictions={}){
 if(!Number.isSafeInteger(now)||now<Date.parse(require('../shadow/registration.json').start_utc))
 throw Error('Research registration has not started; no future backfill');
 const source=loadCapture(dir);
 const fresh=source.events.some(e=>e.market===market&&e.kind==='BOOK_SNAPSHOT'&&
  now-e.timestamps.available_to_model_ms>=0&&now-e.timestamps.available_to_model_ms<=3000);
 const file=path.join(dir,'multi-shadow.jsonl'),journal=readLedger(file);
 if(!fresh)return {status:'DATA_GAP_NO_OBSERVATION',
  source_health:source.health,observation_written:false,trade_authorized:false};
 const feature=F.observe(source.events,market,now);
 const id=market+'-'+now+'-'+feature.sha256.slice(0,10);
 if(journal.some(x=>x.item?.type==='OBSERVATION'&&x.item.id===id))
 return {status:'DUPLICATE_OBSERVATION_REJECTED',observation_written:false,trade_authorized:false};
 const entry=D.observation(feature,models,predictions,now,id);
 const next=L.persist(file,journal,entry.observation,now);
 return {status:'RESEARCH_SHADOW_OBSERVATION_ACCEPTED',event_count:source.events.length,
  entries:next.length,feature_coverage:feature.features.observed,
  no_trade_decisions:entry.no_trade_decisions,authenticated_predictions:entry.authenticated_predictions,
  observation_written:true,training_data_approved:false,trade_authorized:false};
}
function researchTrain(dir,now){
 // No learning unless a separate approved labeling process has already appended matured,
 // source-audited per-engine entries to the same immutable ledger.
 const source=loadCapture(dir);
 const log=readLedger(path.join(dir,'multi-shadow.jsonl'));
 const result=T.train(T.init(),log,now);
 return {...result.report,source_events:source.events.length,
  model_persisted:false,needs_immutable_registry:true,auto_promotion:false};
}
module.exports={loadCapture,readLedger,observeMarket,researchTrain};
