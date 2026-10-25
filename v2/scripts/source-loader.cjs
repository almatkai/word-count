// Validation-only loader: executes byte-exact TS/TSX with the locked TypeScript compiler.
// React hooks and Raycast/DOM/host boundaries are explicit simulation seams.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = path.resolve(__dirname, '..');
const ts = require('../fixtures/libraries/typescript/lib/typescript.js');
const react = require('../fixtures/libraries/react');
const jsx = require('../fixtures/libraries/react/jsx-runtime');
function loader(mocks = {}, globals = {}) {
  const cache = new Map();
  return function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    const source = fs.readFileSync(file, 'utf8');
    const code = ts.transpileModule(source, {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true}}).outputText;
    const localRequire = (id) => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      if (id === 'react') return react;
      if (id === 'react/jsx-runtime') return jsx;
      if (!id.startsWith('.')) throw new Error(`Unmocked external dependency ${id}`);
      const resolved = path.resolve(path.dirname(file), id);
      for (const name of [resolved + '.ts', resolved + '.tsx', path.join(resolved, 'index.ts')]) {
        if (fs.existsSync(name)) return load(name);
      }
      throw new Error(`Missing TS dependency ${id}`);
    };
    vm.runInNewContext(`(function(require,module,exports){${code}\n})`, {console, ...globals}, {filename: file})(localRequire, module, module.exports);
    return module.exports;
  };
}
function hookHarness() {
  let index = 0, slots = [], pending = [], dirty = false;
  const same = (a,b) => a && b && a.length === b.length && a.every((x,i) => Object.is(x,b[i]));
  const hooks = {
    ...react,
    useState(initial) { const i = index++; if (!Object.hasOwn(slots,i)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], value => {const next = typeof value === 'function' ? value(slots[i]) : value; if (!Object.is(next,slots[i])) {slots[i]=next;dirty=true;}}]; },
    useEffect(effect,deps) {const i=index++;if(!same(slots[i],deps)){slots[i]=deps;pending.push(effect);}},
    useMemo(fn,deps) { const i=index++; if(!slots[i] || !same(slots[i].deps,deps)) slots[i]={deps,value:fn()}; return slots[i].value; },
    useCallback(fn,deps) { return hooks.useMemo(()=>fn,deps); },
    useRef(value) {const i=index++;if(!slots[i]) slots[i]={current:value};return slots[i];},
    useImperativeHandle(ref,fn) {if(ref) ref.current=fn();},
    forwardRef(fn) {return fn;},
  };
  return {hooks, async render(fn) {
    let value;
    for(let n=0;n<40;n++) {index=0;dirty=false;value=fn();for(const e of pending.splice(0))e();await new Promise(resolve=>setImmediate(resolve));if(!dirty)return value;}
    throw new Error('Hook simulation did not settle');
  }};
}
function children(node) { return Array.isArray(node) ? node.flatMap(children) : node && typeof node === 'object' ? [node, ...children(node.props?.children)] : []; }
module.exports={base,ts,react,jsx,loader,hookHarness,children};
