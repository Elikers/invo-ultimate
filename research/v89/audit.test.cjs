'use strict';
const assert=require('node:assert/strict'),{audit,pollFeasibility}=require('./audit.cjs');
const registrationTime='2026-11-17T23:57:00Z',now=Date.parse('2026-11-18T02:15:00Z');
const reg={schema:'invo-v7.3-prospective-registration-1',registered_utc:registrationTime,
 preregistered_pairs:[{coin:'JUP',strategy:'volbreak'},{coin:'SOL',strategy:'pullback'}],
 candidates:[{id:'CANDIDATE_SHORTER_TIME_EXIT'},{id:'CANDIDATE_TIGHTER_STOP'}]};
const journal={schema:'invo-v7.3-candidate-paper-1',registered_utc:registrationTime,
 markets:{JUP:{observations:[],gaps:0,last_processed_t:1794966300000},
 SOL:{observations:[],gaps:0,last_processed_t:1794966300000}}};
const summary={schema:'invo-v7.3-candidate-paper-summary-1',registered_utc:registrationTime,closed:0,total_captured:0};
const health={observed_utc:'2026-11-18T01:54:25Z'};
const x=audit(reg,journal,summary,health,now);
assert.equal(x.total_closed,0);assert.equal(x.production_write_allowed,false);
assert.ok(x.anomalies.includes('NO_EXPERIMENTAL_SIGNAL_OBSERVATIONS'));
const observed=Date.parse('2026-11-18T02:00:35Z');
assert.equal(pollFeasibility(observed,observed+15*60000).first_allowable_entry_candle_observed_in_time,false);
assert.equal(pollFeasibility(observed,observed+5*60000).first_allowable_entry_candle_observed_in_time,true);
assert.throws(()=>audit({...reg,registered_utc:'2026-11-18T00:30:00Z'},journal,summary,health,now),/mismatch/);
const broken=structuredClone(journal);
broken.markets.JUP.observations=[{id:'fake',coin:'JUP',strategy:'volbreak',variant:'BASELINE_FROZEN',
 status:'CLOSED',signal_bar_t:Date.parse('2026-11-17T23:00:00Z'),
 observed_at_utc:'2026-11-18T00:00:00Z',entry_t:Date.parse('2026-11-18T00:05:00Z'),
 exit_t:Date.parse('2026-11-18T00:10:00Z'),gross_pct:1}];
assert.throws(()=>audit(reg,broken,summary,health,now),/Retroactive/);
console.log('v8.9 production candidate evidence audit and 5m/15m timing tests passed');
