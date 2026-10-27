#!/usr/bin/env python3
"""Copy actual registry license/notice evidence after locked cargo metadata, never guess."""
from pathlib import Path
import json, shutil, hashlib
base=Path(__file__).resolve().parent.parent
metadata=json.loads((base/'.work/cargo-metadata.json').read_text())
out=base/'licenses/rust'
if out.exists(): shutil.rmtree(out)  # Owned generated evidence only; no implementation edits.
records=[]
for package in metadata['packages']:
    if package['name'] in ['tezbar-word-count','word-count-beta-contracts']:continue
    root=Path(package['manifest_path']).parent
    files=[]
    for file in root.rglob('*'):
        rel=file.relative_to(root)
        if file.is_file() and (file.name.lower().startswith(('license','licence','copying','copyright','notice')) or (rel.parts and rel.parts[0].lower() in ['licenses','licences'])):
            target=out/f"{package['name']}-{package['version']}"/rel
            target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(file,target)
            files.append(str(target.relative_to(base)))
    records.append({'name':package['name'],'version':package['version'],'declaredSpdx':package['license'],'rustVersion':package['rust_version'],'evidence':files,'unresolved':not bool(files)})
(base/'RUST-LICENSES.json').write_text(json.dumps(records,indent=2)+'\n')
print('Registry license evidence:',len(records),'packages; unresolved:',[p['name'] for p in records if p['unresolved']])
