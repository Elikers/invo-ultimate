const fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../v69.js'),'utf8');
const bootstrap=fs.readFileSync(require('node:path').join(__dirname,'../v68.js'),'utf8');
for(const field of ['v69Lab','v69Coverage','v69Closed','v69Net','v69Gate','v69Rows','v69Notice'])assert.ok(source.includes(field),'Missing read-only dashboard field '+field);
for(const name of ['forward-intelligence','consistency','collector-coverage'])assert.ok(source.includes(name),'Missing research dependency '+name);
assert.ok(bootstrap.includes("s.src='v69.js'"),'v6.9 panel missing from site module');
assert.ok(!/placeOrder|executeOrder|walletConnect|sendTransaction/.test(source),'Unexpected execution code in read-only dashboard');
console.log('INVO v6.9 Phase 4 dashboard and frozen site integration tests passed');
