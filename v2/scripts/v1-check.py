#!/usr/bin/env python3
"""Disposable source-fixture V1 tests/typecheck; never run npm in the original root."""
from pathlib import Path
import shutil,subprocess,hashlib,json
base=Path(__file__).resolve().parent.parent;out=base/'.work/v1-disposable'
if out.exists():shutil.rmtree(out)
shutil.copytree(base/'fixtures/own',out)
lock=hashlib.sha256((out/'package-lock.json').read_bytes()).hexdigest()
commands=[['npm','ci','--ignore-scripts','--no-audit','--no-fund'],['npm','test'],['npm','run','typecheck']]
for command in commands:subprocess.run(command,cwd=out,check=True)
assert hashlib.sha256((out/'package-lock.json').read_bytes()).hexdigest()==lock
for original in (base/'fixtures/own').rglob('*'):
 if original.is_file():assert original.read_bytes()==(out/original.relative_to(base/'fixtures/own')).read_bytes()
(base/'.work/v1-results.json').write_text(json.dumps({'test':1,'typecheck':'pass','lockAndSourceUnchanged':True,'npm':'ignore-scripts; no original-root install'},indent=2)+'\n')
print('Disposable V1 test/typecheck passed; lock and source unchanged.')
