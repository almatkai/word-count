# Validation

Implementation branch: `feat/native-v2-rust`. Fresh own `origin/main` source SHA: `472bc57b5b3d4eafbdfc7e5abffb52e11bdac04e`. Beta pin: `fd300e276356587726566026f072563eb9c34cb1`. Original Raycast icon/credits pin: `6734d85992290066fd31a7f5bee3cca3d3545a1a`.

No staging, commits, pushes, PRs, deployment, host/profile/catalog writes, real selection/clipboard/paste/focus/window/browser actions, subdelegation, or completed-clone deletion were performed. Parent review/publishing/clone deletion are separate. The only permitted V1 edit is the root README discovery link.

## Gates

| Gate | Evidence |
|---|---|
| Rust formatting | Engine/examples/tests via `cargo fmt --all -- --check`; adapter/templates via rustfmt with `skip_children=true` so immutable fixtures are not reformatted |
| Stable and Rust 1.85.0 | Engine and concrete adapter fixture crate: tests and strict `clippy --all-targets -- -D warnings` |
| Windows GNU | Both toolchains, both crates: `check --target x86_64-pc-windows-gnu --all-targets` and strict all-target Clippy; compile checks, not linked/running Windows binaries |
| Rust tests | 2 counting/limit/rounding tests; 19 adapter/beta SDK/NativeSessions integration tests |
| Actual own TS oracle | 139,318 counting cases; all BMP UTF-16 units in both whitespace modes, lone/paired surrogates, ECMAScript whitespace, combining marks, emoji/ZWJ, CJK boundaries, supplementary CJK source limitation, punctuation, CRLF/LF, empty values, random mixtures, numeric thresholds |
| Actual commands | 60 startup source/adapter parity scenarios; actual TSX state/effect and JSX execution with locked compiler/React; 3 source component edit/toggle/clear transitions; original 17 Jest-style count tests executed without changing their code |
| Actual renderer contracts | 12 checks executing beta form parser, reconciliation export and surface action wiring; stable keys, `{value}` callbacks, complete form submit map, omitted controlled values, queued drafts, outer Back and primary/secondary action-menu behavior |
| Schema | Full pinned Draft 2020-12 schema via Ajv 8.17.1; 1 valid and 33 invalid manifests plus exact own command/title/preference/argument/platform assertions |
| Icon/provenance/licenses | 202,088 bytes; SHA256 `94f23ca4f94a07e1cbebd9b3f44f105ca231b88662c26aaf63ca221f6d45db7f`; all captured source/library/license hashes and Git visibility audited |
| Packaging | `cargo package --offline --locked --allow-dirty`; every required file compared after extraction; extracted Rust 1.85 engine/adapter tests, TS oracle, renderer/schema/hash checks run offline |
| Disposable V1 | Source-fixture copy, `npm ci --ignore-scripts`, 1 smoke test, `npm run typecheck`; exact original lock/source preserved |

The validation runner writes exact commands/results and logs into ignored `.work/`; a compact final `RESULTS.json` is the durable run summary. Reproduce:

```sh
# Toolchains/targets must already exist. The registry is prefetched once if needed.
cargo fetch --locked
python3 scripts/materialize-beta.py
cargo fetch --locked --manifest-path .work/beta-contracts/Cargo.toml
python3 scripts/validate.py
python3 scripts/v1-check.py
python3 scripts/check-package.py
python3 scripts/audit.py
```

`validate.py` uses `--offline --locked` for Rust. Node oracle/renderer/schema validation loads bundled libraries and never downloads code. Disposable V1 `npm ci` uses the original integrity-pinned lock in its own fixture copy; no original-root npm install or lock rewrite occurs. Extracted tests are self-contained after registry prefetch; no sibling temporary clone or local host checkout is required. The crate includes `.rs.in`/`.toml.in` templates and a lock instead of a nested Cargo package that Cargo would omit. The beta Cargo manifest fixture is named `Cargo.toml.fixture`, retaining exact original bytes without accidentally excluding its Rust subtree from the archive.

## Scope of contract evidence

The **unchanged actual beta** `common.rs`, `v2_sdk.rs`, and `native.rs` compile with the production adapter. The harness's Tauri AppHandle/emitter is an inert labeled type stub; unexpected emits panic. Its router queues explicit read fixtures; unexpected OS operations panic. Its registration and installation code is labeled scaffolding describing the required host additions. NativeSessions itself is not rewritten: session launch/annotation, installation gating, serialized actions, refresh, staged search, disposal, clear, uninstallation and cancellation run through the pinned implementation. Beta's unrelated built-in ExtensionsCore unit-test suite is not run; integration tests link the normal immutable library, and unit-test compilation excludes those fixture modules. The real registration/catalog/installation are not claimed complete.

Renderer tests execute actual TSX parser, reconciliation and surface handlers using a hook simulation and actual locked React JSX, with irrelevant color/UI/DOM boundaries stubbed. They demonstrate protocol behavior, not actual React scheduling, keyboard/desktop usability or end-to-end UI QA. The own TS oracle executes the real own counting code and real command functions; it does not compare against a handwritten JavaScript translation of the Rust algorithm.

The adapter has no write/paste/open/hide actions, so no effect success is claimed from a fake object acknowledgement. All actual selection/clipboard reads in every test are stubbed. SDK storage tests write only disposable temporary directories and preserve unknown keys/reject corruption. No unknown legacy storage migration is asserted.

## Known limits and not-run items

- Result forms deliberately replace HUD/toast output and leave the launcher visible. A true overlay/HUD/toast, original hide/dismissal/focus behavior, and any strict hide acknowledgement integration remain unavailable/unverified; see INTEGRATION.md for the reported beta null-ack dependency.
- Clipboard summary number formatting is en-US; other OS default `toLocaleString()` presentations are a known gap. All integer counting and ceiling behavior matches the actual source oracle.
- Action shortcut metadata is retained, but the pinned beta surface does not implement arbitrary Cmd+T/Cmd+E shortcuts or action icons. Actions remain available in their source order via the action menu. The reset hint points to Clear Text in Actions instead of advertising the unsupported shortcut.
- The count limit is explicit; no silent truncation. Host JSON cannot carry unpaired surrogate strings; the engine's UTF-16 API is separately oracle-tested on them.
- Full-text license evidence for legacy Raycast package metadata and excluded r-efi target dependency is unresolved; details in NOTICES.md. No permissive license was inferred solely from names.
- Host registration/rebuild, managed installation, real macOS/Windows UI/clipboard/selection/permission/focus/window/overlay QA are **not-run**. Both manifest platform verification entries remain **not-run**.

## Search audit

XERJ used canonical root `/Users/almat/Desktop/code/Tezbar APP/rust-extension-ports/word-count`, prefix `ax-5c8424712226`, isolated state, two workers and bounded calls. Initial indexing committed generation 1 with 12/12 code files indexed, 18 files/73 records; exit 3 `completed-with-junk`, with hidden/assets exclusions. Search succeeded. It is not an exhaustive index. Exact current source, fixture, visibility and preservation checks use `rg`, Git byte comparisons and recorded hashes. No global XERJ server restart was attempted.

Final post-edit XERJ refresh exited 1: the frozen dataset rejected the new Cargo.toml schema/family. The index is incomplete after additions. No new prefix, global server restart, or global schema mutation was attempted; exhaustive current-file checks use Git/rg/hashes.
