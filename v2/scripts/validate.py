#!/usr/bin/env python3
"""Reproducible offline engine, adapter, oracle, renderer and Windows compile gates."""
from pathlib import Path
import json, subprocess, time, sys
base=Path(__file__).resolve().parent.parent
work=base/'.work';work.mkdir(exist_ok=True)
def run(name,args):
    print(name,flush=True);start=time.monotonic()
    result=subprocess.run(args,cwd=base,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
    (work/(name+'.log')).write_text(result.stdout)
    print(result.stdout[-500:] if result.returncode else 'pass',flush=True)
    results.append({'gate':name,'command':args,'exitCode':result.returncode,'seconds':round(time.monotonic()-start,2)})
    if result.returncode:
        (work/'validation-results.json').write_text(json.dumps(results,indent=2)+'\n');sys.exit(result.returncode)
results=[]
run('materialize',['python3','scripts/materialize-beta.py'])
run('fmt',['cargo','fmt','--all','--','--check'])
run('adapter-template-fmt',['rustfmt','--edition','2021','--check','--config','skip_children=true','adapter/v2_word_count.rs']+[str(p.relative_to(base)) for p in sorted((base/'tests/templates').glob('*.rs.in'))])
for toolchain in ['stable','1.85.0']:
    for crate,args in [('engine',[]),('beta',['--manifest-path','.work/beta-contracts/Cargo.toml'])]:
        run(toolchain+'-'+crate+'-test',['cargo','+'+toolchain,'test','--offline','--locked']+args)
        run(toolchain+'-'+crate+'-clippy',['cargo','+'+toolchain,'clippy','--offline','--locked']+args+['--all-targets','--','-D','warnings'])
        run(toolchain+'-'+crate+'-windows-check',['cargo','+'+toolchain,'check','--offline','--locked']+args+['--target','x86_64-pc-windows-gnu','--all-targets'])
        run(toolchain+'-'+crate+'-windows-clippy',['cargo','+'+toolchain,'clippy','--offline','--locked']+args+['--target','x86_64-pc-windows-gnu','--all-targets','--','-D','warnings'])
run('oracle-engine-build',['cargo','+stable','build','--offline','--locked','--example','oracle'])
run('oracle-adapter-build',['cargo','+stable','build','--offline','--locked','--manifest-path','.work/beta-contracts/Cargo.toml','--bin','adapter-oracle'])
run('own-ts-oracle',['node','scripts/oracle.cjs'])
run('beta-renderer',['node','scripts/renderer-contracts.cjs'])
run('schema',['node','scripts/schema.cjs'])
run('audit',['python3','scripts/audit.py'])
(work/'validation-results.json').write_text(json.dumps(results,indent=2)+'\n')
print('All',len(results),'validation gates passed; desktop QA not run.')
