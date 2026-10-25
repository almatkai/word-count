#!/usr/bin/env python3
"""Hash evidence, verify V1 preservation, and expose ignored provenance files."""
from pathlib import Path
import hashlib,json,subprocess,sys
base=Path(__file__).resolve().parent.parent
sha=lambda data:hashlib.sha256(data).hexdigest()
provenance=json.loads((base/'PROVENANCE.json').read_text())
for name,evidence in provenance['files'].items():
    file=base/name
    assert file.is_file(),name
    assert sha(file.read_bytes())==evidence['sha256'],name
    assert file.stat().st_size==evidence['bytes'],name
icon=base/'assets/word-count.png'
assert icon.stat().st_size==202088
assert sha(icon.read_bytes())=='94f23ca4f94a07e1cbebd9b3f44f105ca231b88662c26aaf63ca221f6d45db7f'
for other in ['fixtures/own/assets/word-count.png','fixtures/original/assets/word-count.png']:assert icon.read_bytes()==(base/other).read_bytes()
original=json.loads((base/'fixtures/original/package.json').read_text())
assert original['author']=='itsmingjie'
assert original['contributors']==['koayon','chrismessina','litomore','aryan_thatte']
assert json.loads((base/'fixtures/libraries/react/package.json').read_text())['version']=='19.2.3'
assert json.loads((base/'fixtures/libraries/typescript/package.json').read_text())['version']=='5.9.3'
if '--fixtures-only' not in sys.argv:
    root=base.parent
    assert subprocess.check_output(['git','rev-parse','--show-toplevel'],cwd=root,text=True).strip()==str(root)
    source=provenance['source']['commit']
    names=subprocess.check_output(['git','ls-tree','-r','--name-only',source],cwd=root,text=True).splitlines()
    for name in names:
        original=subprocess.check_output(['git','show',source+':'+name],cwd=root)
        assert (base/'fixtures/own'/name).read_bytes()==original,name
        current=(root/name).read_bytes()
        if name=='README.md':
            assert current==original+b'\n## Native V2\n\n[See the Rust Native V2 implementation, integration instructions, and validation results.](v2/README.md)\n'
        else:assert current==original,'V1 changed: '+name
    visible=set(subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z','--','v2'],cwd=root).decode().split('\0'))
    required=[f for f in base.rglob('*') if f.is_file() and f.relative_to(base).parts[0] not in ['.work','target']]
    hidden=[str(f.relative_to(root)) for f in required if str(f.relative_to(root)) not in visible]
    assert not hidden,'Required files hidden from Git: '+str(hidden)
    changed=subprocess.check_output(['git','diff','--name-only'],cwd=root,text=True).splitlines()
    assert all(n=='README.md' or n.startswith('v2/') for n in changed),changed
    beta=Path('/Users/almat/Desktop/code/Tezbar APP/Tezbar')
    if beta.exists():
        for name,evidence in provenance['files'].items():
            if evidence.get('kind')=='beta':
                actual=subprocess.check_output(['git','-C',str(beta),'show',provenance['beta']['commit']+':'+evidence['sourcePath']])
                assert sha(actual)==evidence['sha256'],name
    print('V1 tracked bytes preserved; root README only discovery link; Git visibility:',len(required),'files.')
print('Verified',len(provenance['files']),'evidence hashes and exact original icon.')
