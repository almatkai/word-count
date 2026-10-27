#!/usr/bin/env python3
"""Build, extract and verify the distributed crate offline, including materialized tests."""
from pathlib import Path
import subprocess,tarfile,shutil,json
base=Path(__file__).resolve().parent.parent
subprocess.run(['cargo','+stable','package','--offline','--locked','--allow-dirty'],cwd=base,check=True)
archive=base/'target/package/tezbar-word-count-0.2.0.crate'
out=base/'.work/extracted-package'
if out.exists():shutil.rmtree(out)
out.mkdir(parents=True)
with tarfile.open(archive) as tar:
    for entry in tar.getmembers():
        assert not entry.issym() and not entry.islnk() and not Path(entry.name).is_absolute() and '..' not in Path(entry.name).parts
        assert not any(part in ['.work','target','.git'] for part in Path(entry.name).parts), 'Generated/private file in package: '+entry.name
    tar.extractall(out)
package=out/'tezbar-word-count-0.2.0'
assert (package/'Cargo.toml.orig').read_bytes()==(base/'Cargo.toml').read_bytes()
for file in base.rglob('*'):
    if not file.is_file() or file.relative_to(base).parts[0] in ['.work','target']:continue
    relative=file.relative_to(base)
    if relative.name=='Cargo.toml':continue # Cargo normalizes and retains Cargo.toml.orig
    assert (package/relative).exists(),f'Omitted required file: {relative}'
    assert (package/relative).read_bytes()==file.read_bytes(),f'Changed package bytes: {relative}'
for args in [['python3','scripts/materialize-beta.py'],['cargo','+1.85.0','test','--offline','--locked'],['cargo','+1.85.0','test','--offline','--locked','--manifest-path','.work/beta-contracts/Cargo.toml'],['cargo','+stable','build','--offline','--locked','--example','oracle'],['cargo','+stable','build','--offline','--locked','--manifest-path','.work/beta-contracts/Cargo.toml','--bin','adapter-oracle'],['node','scripts/oracle.cjs'],['node','scripts/renderer-contracts.cjs'],['node','scripts/schema.cjs'],['python3','scripts/audit.py','--fixtures-only']]:
    subprocess.run(args,cwd=package,check=True)
(base/'.work/package-results.json').write_text(json.dumps({'cargoPackage':'pass','extractedOfflineTests':'pass','allRequiredFilesPresent':True,'archiveBytes':archive.stat().st_size},indent=2)+'\n')
print('Package and extracted offline tests passed.')
