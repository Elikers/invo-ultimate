#!/usr/bin/env node
'use strict';
// Opt-in research-only learning step. Reads local hash-verified shadow records and
// third-party-audited TRAIN-only labels; NEVER deploys, trades or modifies website.
// No user-controlled clock override. CI tests simulate time only in isolated unit tests.
const path=require('node:path'),fs=require('node:fs');
const {step}=require('./store.cjs');
const args=process.argv.slice(2);
const value=flag=>{const i=args.indexOf(flag);return i<0?null:args[i+1]};
if(!args.includes('--research-only')||args.some(x=>/wallet|private|live-order|leverage|deploy|production/i.test(x)))
 throw Error('Only --research-only, no trade/deploy options');
const expert=value('--expert'),dir=value('--dir'),journal=value('--shadow-journal'),rows=value('--audited-labels');
if(!expert||!dir||!journal||!rows||
 [dir,journal,rows].some(x=>!path.isAbsolute(x)))throw Error('Explicit absolute research paths required');
if(!fs.existsSync(journal)||!fs.existsSync(rows))throw Error('Required audited source files missing; no training');
const result=step(dir,expert,journal,rows,Date.now());
console.log(JSON.stringify({status:result.accepted_for_training?'RESEARCH_CHALLENGER_UPDATED':'NO_ELIGIBLE_TRAINING_DATA',
 expert,...result},null,2));
