const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {spawnSync}=require('node:child_process');
const {base,loader,hookHarness,children}=require('./source-loader.cjs');
const renderer=path.join(base,'fixtures/beta/src/renderer/src/raycast-api');
function native(steps=[]){const run=spawnSync(path.join(base,'.work/beta-contracts/target/debug/adapter-oracle'),[],{input:JSON.stringify({command:'count',selected:{value:'initial'},clipboard:{value:''},steps})+'\n',encoding:'utf8'});assert.equal(run.status,0,run.stderr);return JSON.parse(run.stdout);}
const noEffects={addEventListener(){},removeEventListener(){},clearTimeout(){},setTimeout(){throw Error('Unexpected timer');},tezbar:new Proxy({}, {get(){throw Error('OS effects forbidden');}})};
const primitives={Hint:'Hint',HintBar:'HintBar',Kbd:'Kbd',ViewHeader:'ViewHeader'};
const detail={parseNativeColorWheel:()=>null,NativeColorWheel:'NativeColorWheel'}; // color-only boundary
const actionComponents={Action:'Action',ActionPanel:'ActionPanel',ActionPanelOverlay:'ActionPanelOverlay'};
(async()=>{
 const formHooks=hookHarness(),surfaceHooks=hookHarness(), events=[];
 const form=loader({react:formHooks.hooks,'../../ui/primitives':primitives,'./detail-runtime':detail},{window:noEffects,HTMLTextAreaElement:class HTMLTextAreaElement{}})(path.join(renderer,'form-runtime.tsx'));
 const surface=loader({react:surfaceHooks.hooks,'./form-runtime':form,'./detail-runtime':{DetailRuntime:'DetailRuntime'},'./grid-runtime':{GridRuntime:'GridRuntime'},'./list-runtime':{ListRuntime:'ListRuntime'},'./hooks':{setRuntimeContext(){},NavigationContext:surfaceHooks.hooks.createContext({})},'./action-runtime':actionComponents},{window:noEffects})(path.join(renderer,'index.tsx'));
 const result=native([{action:'text',formValues:{value:'server older'}},{action:'toggle'}]);
 const props={sessionId:'native-extension:fixture',title:'Word Count',extensionId:'com.tezbar.native.word-count',commandName:'count',root:result.view.root,actions:result.view.actions,onBack:()=>events.push(['back']),onSearchTextChanged:()=>{throw Error('No source search');},onLoadMore:()=>{throw Error('No source load');},onInvokeAction:(...args)=>events.push(JSON.parse(JSON.stringify(args)))};
 const drawSurface=()=>surfaceHooks.render(()=>surface.ExtensionRuntimeSurface(props));
 let tree=await drawSurface();let formNode=children(tree).find(n=>n.type===form.FormRuntime);assert.ok(formNode);
 const drawForm=()=>formHooks.render(()=>form.FormRuntime(formNode.props,formNode.props.ref));
 let formTree=await drawForm();let textarea=children(formTree).find(n=>n.type==='textarea'),checkbox=children(formTree).find(n=>n.type==='input'&&n.props.type==='checkbox');
 assert.equal(textarea.props.value,'initial');assert.equal(checkbox.props.checked,true);
 // Real parser callback -> real surface wrapper -> exact adapter formValues.value contract.
 textarea.props.onChange({target:{value:'queued newer draft'}});
 assert.deepEqual(events.pop(),[result.view.root.children.find(n=>n.type==='Form.TextArea').props.actionId,{value:'queued newer draft'}]);
 checkbox.props.onChange({target:{checked:false}});
 assert.deepEqual(events.pop(),[result.view.root.children.find(n=>n.type==='Form.Checkbox').props.actionId,{value:false}]);
 formTree=await drawForm();assert.equal(children(formTree).find(n=>n.type==='textarea').props.value,'queued newer draft');
 // Render an older text callback response whose controlled props were omitted by the adapter.
 props.root=result.views[1].root;tree=await drawSurface();formNode=children(tree).find(n=>n.type===form.FormRuntime);formTree=await drawForm();
 assert.equal(children(formTree).find(n=>n.type==='textarea').props.value,'queued newer draft');assert.equal(children(formTree).find(n=>n.type==='input'&&n.props.type==='checkbox').props.checked,false);
 formTree.props.onSubmit({preventDefault(){}});
 assert.deepEqual(events.pop(),[result.view.actions[0].id,{text:'queued newer draft','include-whitespace':false}]);
 // A real toggle response controls only checkbox; text stays at the newer local draft.
 props.root=result.views[2].root;tree=await drawSurface();formNode=children(tree).find(n=>n.type===form.FormRuntime);formTree=await drawForm();
 assert.equal(children(formTree).find(n=>n.type==='textarea').props.value,'queued newer draft');
 // Back invokes the source's outer back callback; no invented nested navigation/draft reset.
 formNode.props.onBack();assert.deepEqual(events.pop(),['back']);
 // Actual action overlay wiring: primary uses complete form map, secondary has no map.
 formNode.props.onOpenActions();tree=await drawSurface();const overlay=children(tree).find(n=>n.type==='ActionPanelOverlay');assert.ok(overlay);
 overlay.props.onExecute(props.actions[0]);assert.deepEqual(events.pop(),[props.actions[0].id,{text:'queued newer draft','include-whitespace':false}]);
 overlay.props.onExecute(props.actions[1]);assert.deepEqual(events.pop(),[props.actions[1].id]);
 // Actual reconciliation export: repeated controlled values overwrite; omitted values preserve.
 const fields=[{key:'text:Form.TextArea',id:'text',type:'Form.TextArea',actionId:'bound',value:'older'}];
 assert.equal(form.reconcileFormValues(fields,{text:'newer'},fields).text,'older');
 assert.equal(form.reconcileFormValues([{...fields[0],value:undefined}],{text:'newer'},fields).text,'newer');
 const summary={actualParser:true,actualReconciliation:true,actualSurfaceActionWiring:true,checks:12,desktopQA:false};
 fs.writeFileSync(path.join(base,'.work/renderer-results.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
})().catch(e=>{console.error(e);process.exitCode=1;});
