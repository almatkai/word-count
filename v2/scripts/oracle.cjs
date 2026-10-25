const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const {spawnSync} = require('node:child_process');
const {base,ts,loader,hookHarness,children} = require('./source-loader.cjs');
assert.equal(ts.version,'5.9.3');
assert.equal(require('../fixtures/libraries/react/package.json').version,'19.2.3');
assert.equal(new Intl.NumberFormat().resolvedOptions().locale,'en-US','Oracle numeric formatting requires the documented en-US locale');
const unhandled=[];process.on('unhandledRejection',error=>unhandled.push(error));
const source = path.join(base,'fixtures/own/src');
const count = loader()(path.join(source,'lib/count/count.ts')).count;
let sourceTests=0;
loader({}, {describe:(_,fn)=>fn(),test:(_,fn)=>{fn();sourceTests++;},expect:value=>({toBe:expected=>assert.equal(value,expected)})})(path.join(source,'lib/count/count.test.ts'));
const texts=['',' \n\t','a\r\n\r\nb','a...','...\na','..\u2028x','a.\nb','foo-bar can’t can\'t','👨‍👩‍👦 e\u0301','𠀀𠀁','你好，世界！','日本語 English 한국어','a?!?b...c','a\u0085b','\ufeffx\ufeff'];
for (const n of [179,180,181,274,275,276,549,550,551,999,1000,1001]) texts.push(Array(n).fill('word').join(' '));
for(let c=0;c<=0xffff;c++)texts.push(String.fromCharCode(c));
const alphabet=['a','b','1',' ','\n','\r','\t','\u00a0','\u0085','\u1680','\u180e','\u2000','\u200b','\ufeff','\u2028','\u2029','\u205f','-','!','?','…','.',':',';','¿','¡','\'','"','你','好','\u3000','\u3001','\u303f','\u3040','\u30ff','\u3400','\u4dbf','\u4e00','\u9fff','\uac00','\ud7af','\uf900','\ufaff','\ufe30','\ufe4f','\uff01','\uff0f','\uff1a','\uff20','\uff3b','\uff40','\uff5b','\uff65','𠀀','𪛟','😀','\ud800','\udfff','\u0301','\u200d'];
let seed=0x17a53;
function random(n){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)%n;}
for(let n=0;n<4096;n++){let t='';for(let j=0,size=random(180);j<size;j++)t+=alphabet[random(alphabet.length)];texts.push(t);}
const cases=texts.flatMap(text=>[false,true].map(includeWhitespace=>({text,includeWhitespace,units:Array.from({length:text.length},(_,i)=>text.charCodeAt(i))})));
const run=spawnSync(path.join(base,'target/debug/examples/oracle'),[],{input:cases.map(({units,includeWhitespace})=>JSON.stringify({units,includeWhitespace})).join('\n')+'\n',encoding:'utf8',maxBuffer:256*1024*1024});
assert.equal(run.status,0,run.stderr);const results=run.stdout.trim().split('\n').map(s=>JSON.parse(s));assert.equal(results.length,cases.length);
for(let i=0;i<cases.length;i++){const c=cases[i];assert.deepEqual(results[i].counts,JSON.parse(JSON.stringify(count(c.text,c.includeWhitespace))),`Oracle mismatch ${i}: ${JSON.stringify(c.text)}`);}
// Exact source component execution: all React state/effect transitions, actual JSX runtime.
function components(){const Form=Object.assign('Form',{Description:'Form.Description',TextArea:'Form.TextArea',Checkbox:'Form.Checkbox'});return {Form,ActionPanel:'ActionPanel',Action:'Action',Icon:{Switch:'Switch',Trash:'Trash'}};}
async function ownCommand(input){
  const calls=[],hud=[],toast=[];const hooks=hookHarness();
  const api={...components(),Toast:{Style:{Success:'Success'}},getSelectedText:async()=>{calls.push('core:platform:selected-text');if(input.selected.error)throw Error('PRIVATE');return input.selected.value;},Clipboard:{readText:async()=>{calls.push('clipboard:read');if(input.clipboard.error)throw Error('PRIVATE');return input.clipboard.value;}},showHUD:async m=>hud.push(m),showToast:async m=>toast.push(m)};
  const command=loader({'@raycast/api':api,react:hooks.hooks})(path.join(source,input.command+'.tsx')).default;
  if(input.command==='count'){
    const node=await hooks.render(()=>command());if(unhandled.length)throw unhandled.shift();const all=children(node);const fields=all.filter(n=>n.type==='Form.TextArea'||n.type==='Form.Checkbox');
    return {calls,message:all.find(n=>n.type==='Form.Description').props.text,text:fields[0].props.value,whitespace:fields[1].props.value,notices:toast.map(t=>t.title),node,command,hooks};
  }
  await command();return {calls,message:input.command==='count-overlay'?toast.at(-1).title:hud.at(-1)};
}
(async()=>{
 const commandInputs=[];
 for(const command of ['count','count-screenshot','count-overlay'])for(const selected of [{value:' selected 世界 '},{value:''},{value:' \ufeff\t'},{error:true}])for(const clip of ['', ' one ', 'a\r\n\r\nb',Array(1001).fill('x').join(' ')])commandInputs.push({command,selected,clipboard:{value:clip}});
 for(const command of ['count','count-screenshot','count-overlay'])for(const selected of [{value:' selected 世界 '},{value:''},{value:' \ufeff\t'},{error:true}])commandInputs.push({command,selected,clipboard:{error:true}});
 const native=spawnSync(path.join(base,'.work/beta-contracts/target/debug/adapter-oracle'),[],{input:commandInputs.map(i=>JSON.stringify(i)).join('\n')+'\n',encoding:'utf8',maxBuffer:32*1024*1024});assert.equal(native.status,0,native.stderr);
 const actual=native.stdout.trim().split('\n').map(s=>JSON.parse(s));
 for(let i=0;i<commandInputs.length;i++){
  const input=commandInputs[i],got=actual[i];let expected;try{expected=await ownCommand(input);}catch{assert.equal(got.state.error,true);assert.ok(got.view.root.props.markdown.includes('Unable to count'));assert.ok(!JSON.stringify(got.view).includes('PRIVATE'));continue;}assert.deepEqual(got.calls,expected.calls);
  assert.equal(got.view.root.children[0].props.text,expected.message);
  if(input.command==='count'){assert.equal(got.state.text,expected.text);assert.equal(got.state.include_whitespace,expected.whitespace);assert.equal(got.state.notice,expected.notices.join(' · '));}
 }
 const component=await ownCommand({command:'count',selected:{value:'first'},clipboard:{value:''}});
 let all=children(component.node);all.find(n=>n.type==='Form.TextArea').props.onChange('edited 世');
 let updated=await component.hooks.render(()=>component.command());
 assert.equal(children(updated).find(n=>n.type==='Form.Description').props.text, count('edited 世',true).characters+' characters · 2 words \n1 sentences · 1 paragraphs \n1 minutes to read · 1 minutes to speak');
 children(updated).find(n=>n.type==='Form.Checkbox').props.onChange(false);updated=await component.hooks.render(()=>component.command());
 assert.equal(children(updated).find(n=>n.type==='Form.Checkbox').props.value,false);
 const actions=children(updated.props.actions);assert.deepEqual(actions.filter(n=>n.type==='Action').map(n=>n.props.title),['Toggle Whitespace','Clear Text']);
 actions.find(n=>n.props.title==='Clear Text').props.onAction();updated=await component.hooks.render(()=>component.command());assert.equal(children(updated).find(n=>n.type==='Form.TextArea').props.value,'');
 const summary={sourceTests,countingOracleCases:cases.length,actualCommandParityCases:commandInputs.length,sourceComponentTransitions:3,typescript:ts.version,react:'19.2.3',locale:'en-US',seed:'0x17a53'};
 fs.mkdirSync(path.join(base,'.work'),{recursive:true});fs.writeFileSync(path.join(base,'.work/oracle-results.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
})().catch(e=>{console.error(e);process.exitCode=1;});
