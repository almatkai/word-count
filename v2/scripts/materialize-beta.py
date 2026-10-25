#!/usr/bin/env python3
"""Materialize a self-contained test crate; templates survive cargo package."""
from pathlib import Path
import shutil
base = Path(__file__).resolve().parent.parent
out = base / '.work/beta-contracts'
out.mkdir(parents=True, exist_ok=True)
for name, dest in [('beta-Cargo.toml.in', 'Cargo.toml'), ('beta-lib.rs.in', 'src/lib.rs'), ('beta-tests.rs.in', 'tests/contracts.rs'), ('beta-oracle.rs.in', 'src/bin/oracle.rs')]:
    target = out / dest
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(base / 'tests/templates' / name, target)
for source, target in [('fixtures/beta/src-tauri/src/native_core/common.rs', 'src/native_core/common.rs'), ('fixtures/beta/src-tauri/src/native_core/extensions/v2_sdk.rs', 'src/native_core/extensions/v2_sdk.rs'), ('fixtures/beta/src-tauri/src/native_core/extensions/native.rs', 'src/native_core/extensions/native.rs'), ('adapter/v2_word_count.rs', 'src/native_core/extensions/v2_word_count.rs')]:
    dest = out / target
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(base / source, dest)
lock = base / 'tests/templates/beta-Cargo.lock'
if lock.exists(): shutil.copyfile(lock, out / 'Cargo.lock')
print(out)
