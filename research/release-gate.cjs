/* INVO v6.7 release safety: frozen strategy engine baseline, explicit approvals to change baseline. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const BASELINE={
 'index.html':'605deb4c8b4c00a2cea90d54be2c30ec2d6c5d44',
 'v61-core.js':'4c9762f67b6262dc8cd3854281b8aaf1e882dc47',
 'research/forward.cjs':'aa493d50abe4fc091810011933bc128df9030b4f'
};
function check(root){
 const verified={};
 for(const [file,expected]of Object.entries(BASELINE)){
  const full=path.join(root,file);if(!fs.existsSync(full))throw Error('Missing frozen trading file '+file);
  const actual=cp.execFileSync('git',['hash-object',file],{cwd:root,encoding:'utf8'}).trim();
  if(actual!==expected)throw Error('FROZEN_TRADING_FILE_CHANGED: '+file+' expected '+expected+' got '+actual+'; requires explicit strategy-change approval and updated test baseline');
  verified[file]=actual;
 }
 return verified;
}
if(require.main===module){
 try{console.log('Frozen trading files verified:',JSON.stringify(check(path.resolve(__dirname,'..'))))}
 catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={BASELINE,check};
