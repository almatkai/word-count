#!/usr/bin/env python3
"""Regenerate hashes after independently checking fixture bytes against their pinned origins."""
from pathlib import Path
import hashlib,json
base=Path(__file__).resolve().parent.parent
records={}
for folder in ['fixtures','assets','licenses']:
    for file in sorted((base/folder).rglob('*')):
        if not file.is_file():continue
        name=str(file.relative_to(base));record={'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'bytes':file.stat().st_size}
        if name.startswith('fixtures/beta/'):
            source=name[len('fixtures/beta/'):]
            if source.endswith('Cargo.toml.fixture'):source=source[:-len('.fixture')]
            record.update(kind='beta',sourcePath=source)
        elif name.startswith('fixtures/own/'):record.update(kind='own',sourcePath=name[len('fixtures/own/'):])
        elif name.startswith('fixtures/original/'):record.update(kind='original',sourcePath='extensions/word-count/'+name[len('fixtures/original/'):])
        elif name.startswith('fixtures/libraries/'):record.update(kind='locked-own-library')
        elif name.startswith('fixtures/schema/'):record.update(kind='locked-validation-library')
        elif name.startswith('licenses/'):record.update(kind='actual-license-text')
        else:record.update(kind='icon')
        records[name]=record
for name in ['SOURCE.json','LICENSES.json','RUST-LICENSES.json','Cargo.lock','tests/templates/beta-Cargo.lock']:
    data=(base/name).read_bytes();records[name]={'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'kind':'metadata-or-lock'}
provenance={'source':{'repository':'https://github.com/almatkai/word-count','commit':'472bc57b5b3d4eafbdfc7e5abffb52e11bdac04e','branch':'feat/native-v2-rust','base':'freshly fetched origin/main','fixture':'fixtures/own'},'beta':{'repository':'https://github.com/almatkai/Tezbar','commit':'fd300e276356587726566026f072563eb9c34cb1','access':'read-only git show; no host edits','fixture':'fixtures/beta'},'original':{'repository':'https://github.com/raycast/extensions','commit':'6734d85992290066fd31a7f5bee3cca3d3545a1a','path':'extensions/word-count','author':'itsmingjie','contributors':['koayon','chrismessina','litomore','aryan_thatte'],'rawPrefix':'https://raw.githubusercontent.com/raycast/extensions/6734d85992290066fd31a7f5bee3cca3d3545a1a/extensions/word-count/'},'libraries':{'typescript':{'version':'5.9.3','source':'actual own npm ci, original lock integrity, executable compiler and package/license notices retained'},'react':{'version':'19.2.3','source':'actual own npm ci, original lock integrity, runtime/JSX and license retained'},'schema':{'version':'Ajv 8.17.1','source':'separate integrity-pinned validation lock and actual complete package files'},'rust':'Cargo.lock and tests/templates/beta-Cargo.lock; actual beta direct dependency versions, no dynamic runtime downloads'},'icon':{'path':'assets/word-count.png','bytes':202088,'sha256':'94f23ca4f94a07e1cbebd9b3f44f105ca231b88662c26aaf63ca221f6d45db7f','catalogUrl':'/extensions/icons/word-count.png','hostDestination':'src/renderer/public/extensions/icons/word-count.png'},'files':records}
(base/'PROVENANCE.json').write_text(json.dumps(provenance,indent=2)+'\n')
print('Recorded',len(records),'evidence hashes.')
