#!/usr/bin/env node
'use strict';
// Explicit opt-in local research only. Does not start services or schedule future runs.
// Run on a separately approved host with trusted ongoing source capture and durable storage.
const path=require('node:path'),{runOnce}=require('./cycle.cjs');
const args=process.argv.slice(2);
const i=args.indexOf('--dir'),dir=i>=0?args[i+1]:null;
if(!args.includes('--research-only')||typeof dir!=='string'||!path.isAbsolute(dir)||
 args.some(x=>/private|wallet|leverage|place.order|live.trade|api.key|production|deploy/i.test(x)))
 throw Error('Require --research-only --dir /absolute/path; trading/production options forbidden');
const result=runOnce(dir,Date.now());
console.log(JSON.stringify(result,null,2));
