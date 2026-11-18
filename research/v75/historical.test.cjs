'use strict';
const assert=require('node:assert/strict'),C=require('../../v61-core.js');
const {reportFromArchive}=require('./historical.cjs');
const begin=Date.UTC(2026,8,1),bars=Array.from({length:4032},(_,i)=>{
 const p=100+Math.sin(i/25)*2+i*.001;
 return {t:begin+i*300000,o:p,h:p+.4,l:p-.4,c:p+.02,v:100};
});
const meta={kind:'RETROSPECTIVE_ONLY_NOT_FORWARD',source:'BINANCE_VISION_USDM_HISTORICAL_ARCHIVE',
 symbol:'BTCUSDT',bars,hashes:Array.from({length:14},(_,i)=>({day:'2026-09-'+String(i+1).padStart(2,'0'),sha256:'a'.repeat(64)}))};
assert.ok(C.valid(bars));
const result=reportFromArchive(meta);
assert.equal(result.results.length,14);
assert.equal(result.evidence,'RETROSPECTIVE_ARCHIVE_ONLY_NOT_FORWARD_NOT_TRADABLE');
assert.throws(()=>reportFromArchive({...meta,symbol:'JUPUSDT'}),/provenance/);
assert.throws(()=>reportFromArchive({...meta,bars:bars.slice(1)}),/Incomplete/);
assert.throws(()=>reportFromArchive({...meta,hashes:[]}),/verified/);
console.log('Frozen engine integration tests passed; no production mutation');
