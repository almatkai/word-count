const assert=require('node:assert/strict');
const fs=require('node:fs');
const Ajv=require('../fixtures/schema/node_modules/ajv/dist/2020.js').default;
const schema=require('../fixtures/beta/schemas/extension-v2.schema.json');
const manifest=require('../extension-v2.json');
const own=require('../fixtures/own/package.json');
const validate=new Ajv({strict:false,allErrors:true}).compile(schema);
assert.equal(validate(manifest),true,JSON.stringify(validate.errors));
let negative=0;
function reject(change){const copy=structuredClone(manifest);change(copy);assert.equal(validate(copy),false,JSON.stringify(copy));negative++;}
for(const key of schema.required)reject(m=>delete m[key]);
for(const [key,value] of [['schemaVersion',1],['runtime','javascript'],['id','com.tezbar.word-count'],['slug','../word-count'],['name',''],['version',''],['author','itsmingjie'],['icon','assets/word-count.png'],['replaces',[]],['replaces',['com.tezbar.word-count']],['commands',[]],['preferences',null],['platforms',['macOS','macOS']],['platforms',['linux']],['verification',[]]])reject(m=>m[key]=value);
for(const key of ['name','platforms','runtime'])reject(m=>delete m.commands[0][key]);
reject(m=>m.commands[0].platforms=[]);reject(m=>m.commands[0].runtime='native');reject(m=>m.verification[0].state='tested');reject(m=>delete m.verification[0].platform);reject(m=>m.verification[1]=m.verification[0]);
// Stronger repository assertions beyond the permissive command extension schema.
assert.deepEqual(manifest.commands.map(c=>c.name),own.commands.map(c=>c.name));
assert.deepEqual(manifest.commands.map(c=>c.title),own.commands.map(c=>c.title));
assert.deepEqual(manifest.preferences,own.preferences??[]);
for(let i=0;i<manifest.commands.length;i++){
 assert.deepEqual(manifest.commands[i].arguments,own.commands[i].arguments??[]);
 assert.deepEqual(manifest.commands[i].preferences,own.commands[i].preferences??[]);
 assert.deepEqual(manifest.commands[i].platforms,own.commands[i].platforms);
}
assert.deepEqual(manifest.verification.map(v=>[v.platform,v.state]),[['macOS','not-run'],['Windows','not-run']]);
assert.equal(manifest.id,'com.tezbar.native.word-count');assert.deepEqual(manifest.replaces,['raycast.word-count']);
const summary={validator:'Ajv 8.17.1 draft 2020-12',positive:1,negative,sourceMetadataAssertions:true};
fs.writeFileSync(require('node:path').join(__dirname,'../.work/schema-results.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
