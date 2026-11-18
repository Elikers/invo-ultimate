'use strict';
const fs=require('node:fs'),{audit,pollFeasibility}=require('./audit.cjs');
const root=process.argv[2];if(!root)throw Error('Missing production checkout');
function read(x){return JSON.parse(fs.readFileSync(root+'/research/'+x,'utf8'))}
const reg=read('v7-registration.json'),j=read('v7-paper-journal.json');
const s=read('v7-paper-summary.json'),h=read('collector-health.json');
const out=audit(reg,j,s,h);
const samplePollLatency=pollFeasibility(Date.parse('2026-11-18T02:00:35Z'),Date.parse('2026-11-18T02:15:35Z'));
console.log(JSON.stringify({audit:out,
 example_only_15min_poll:samplePollLatency,
 actual_last_candidate_observation_utc:j.updated_utc,
 warning:'Example timing is illustrative, not a claim about actual GitHub poll intervals.'},null,2));
