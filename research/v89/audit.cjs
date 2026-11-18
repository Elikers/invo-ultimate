'use strict';
/* INVO v8.9 research-only audit of existing candidate collector.
 No exchange calls, retroactive trades, or writes to production.
 */
const BAR=300000;
function audit(reg,journal,summary,health,now=Date.now()){
 if(reg?.schema!=='invo-v7.3-prospective-registration-1'||
 journal?.schema!=='invo-v7.3-candidate-paper-1'||
 summary?.schema!=='invo-v7.3-candidate-paper-summary-1')throw Error('Invalid candidate evidence provenance');
 if(reg.registered_utc!==journal.registered_utc||summary.registered_utc!==reg.registered_utc)
  throw Error('Candidate registration mismatch');
 if(!Number.isFinite(Date.parse(reg.registered_utc))||!Number.isFinite(now))throw Error('Invalid time');
 const output={schema:'invo-v8.9-paper-collector-audit-1',source:'EXISTING_PRODUCTION_SNAPSHOT_READ_ONLY',
  markets:{},total_observations:0,total_closed:0,total_pending:0,total_open:0,
  total_expired:0,total_unresolved:0,anomalies:[],hypothetical_execution_verified:false,
  production_write_allowed:false};
 for(const pair of reg.preregistered_pairs){
  const m=journal.markets?.[pair.coin],rows=m?.observations||[];
  if(!m||!Array.isArray(rows)){output.anomalies.push('MARKET_JOURNAL_MISSING_'+pair.coin);continue;}
  const seen=new Set();const counts={PENDING:0,OPEN:0,CLOSED:0,EXPIRED:0,UNRESOLVED_GAP:0};
  for(const x of rows){
   if(typeof x.id!=='string'||seen.has(x.id)||x.coin!==pair.coin||x.strategy!==pair.strategy)
    throw Error('Duplicate or incompatible observation');
   seen.add(x.id);
   if(!(x.status in counts))throw Error('Unknown observation status');
   if(!['BASELINE_FROZEN',...reg.candidates.map(y=>y.id)].includes(x.variant))
    throw Error('Unknown experimental variant');
   if(!Number.isSafeInteger(x.signal_bar_t)||!Number.isSafeInteger(x.entry_t)||
      !Number.isFinite(Date.parse(x.observed_at_utc))||
      x.signal_bar_t+BAR>Date.parse(x.observed_at_utc)||x.entry_t<=Date.parse(x.observed_at_utc)||
      x.signal_bar_t+BAR<=Date.parse(reg.registered_utc))
      throw Error('Retroactive/invalid prospective signal chronology');
   counts[x.status]++;
   if(x.status==='CLOSED'&&(!Number.isFinite(x.gross_pct)||!Number.isFinite(x.exit_t)||x.exit_t<=x.entry_t))
    throw Error('Closed trade missing hypothetical accounting');
  }
  const total=rows.length;
  output.total_observations+=total;output.total_closed+=counts.CLOSED;
  output.total_pending+=counts.PENDING;output.total_open+=counts.OPEN;
  output.total_expired+=counts.EXPIRED;output.total_unresolved+=counts.UNRESOLVED_GAP;
  output.markets[pair.coin]={pair_strategy:pair.strategy,rows:total,counts,gaps:m.gaps||0,
    last_processed_completed_bar_t:m.last_processed_t||null};
  if((m.gaps||0)>0)output.anomalies.push('PROSPECTIVE_DATA_GAPS_'+pair.coin);
 }
 if(output.total_closed!==summary.closed||output.total_observations!==summary.total_captured)
  throw Error('Summary/journal total mismatch');
 const latest=Date.parse(health?.observed_utc||'');
 output.heartbeat_age_minutes=Number.isFinite(latest)&&latest<=now?(now-latest)/60000:null;
 if(output.heartbeat_age_minutes===null||output.heartbeat_age_minutes>45)
  output.anomalies.push('COLLECTOR_HEARTBEAT_STALE_OR_INVALID');
 if(output.total_observations===0)output.anomalies.push('NO_EXPERIMENTAL_SIGNAL_OBSERVATIONS');
 output.status=output.anomalies.length?'EVIDENCE_COLLECTION_NOT_PROVEN':'OBSERVATIONS_PRESENT_VALIDATE_FORWARD_OUTCOMES';
 output.explanation=[
  'A 15-minute GitHub poll can miss a planned next-5-minute entry. Existing v7 collector expires those entries instead of fabricating fills.',
  'An empty journal may mean no strategy signals, missed polling opportunities, or both. This report does not establish the cause.',
  'Zero observations are not profitability evidence. No existing forward counts are changed.'
 ];
 return output;
}
function pollFeasibility(observedAtMs,nextPollMs){
 if(![observedAtMs,nextPollMs].every(Number.isFinite)||nextPollMs<=observedAtMs)throw Error('Invalid poll chronology');
 const planned=(Math.floor(observedAtMs/BAR)+1)*BAR;
 return {planned_next_bar_t:planned,first_allowable_entry_candle_observed_in_time:nextPollMs<planned+BAR,
  next_poll_latency_minutes:(nextPollMs-observedAtMs)/60000,
  needs_a_completed_entry_bar_before_ledger_marking:true,
  note:'15-minute next poll is usually too late to observe a scheduled 5-minute entry without using retrospective fills'};
}
module.exports={audit,pollFeasibility};
