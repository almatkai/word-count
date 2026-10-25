# Integration with pinned beta

Target host: `fd300e276356587726566026f072563eb9c34cb1`. All host evidence in `fixtures/beta/` was read with `git show` at that pin; the dirty `fix/deep-search-state` checkout was never edited. These are review instructions, not changes already applied to Tezbar. Native V2 is compiled-in: copying the JSON manifest alone cannot install executable Rust.

## Stable vendoring and compilation

Vendor the contents of this `v2/` package at **`src-tauri/native-extensions/word-count/`**. Exclude generated `target/` and `.work/`. Keep the adapter adjacent to its engine, not in a temporary clone. Add to the host `src-tauri/Cargo.toml`:

```toml
tezbar-word-count = { path = "native-extensions/word-count" }
```

The engine pins serde `1.0.228` and serde_json `1.0.150`, exactly the pinned beta's resolved versions. Its standalone lock is included. The contract crate also pins beta's actual tokio `1.52.3`, uuid `1.23.3`, tempfile `3.27.0`, and log `0.4.32`; it does not silently substitute older SDK dependencies. Host lock reconciliation/rebuild is an integration step and has not been performed.

In `src-tauri/src/native_core/extensions/mod.rs`, add the sibling of the existing `v2_sdk` module:

```rust
#[path = "../../../native-extensions/word-count/adapter/v2_word_count.rs"]
mod v2_word_count;
```

The production adapter imports `super::v2_sdk` and `crate::native_core::common`, matching their actual locations. It is compiled in the contract harness against **unchanged** `common.rs`, `v2_sdk.rs`, and `native.rs` bytes. The harness's Tauri type/emitter, router, registration, and installation seams are explicitly labeled stubs. These do not demonstrate real Tauri integration or installation.

In `v2_runtime.rs` add `"word-count"` to the slug whitelist, then:

```rust
// commands match arm
"word-count" => super::v2_word_count::commands(),
// handle match arm
"word-count" => super::v2_word_count::handle(ctx, command, operation, payload, state).await,
```

`commands()` exposes exactly `count`, `count-screenshot`, `count-overlay` on macOS and Windows, and no commands on unsupported platforms. Existing canonical/legacy prefix handling must resolve `word-count`, `raycast.word-count`, and `com.tezbar.native.word-count` to this slug. `replaces` is **`["raycast.word-count"]`**; the own V1 manifest ID is separately `com.tezbar.word-count`. Do not rewrite the own V1 ID or delete its package.

Append `extension-v2.json` as one entry in the existing `v2_catalog.json` array. Keep the schema2 canonical ID, three commands, empty preference/argument arrays, and both `not-run` verification records. Verify the full pinned schema and compiled coverage: each listed command must satisfy `v2_runtime::supports(canonical_id, command)` and return `rust` on its declared platform; an unregistered adapter must remain unavailable. The tests exercise this with a **registration stub** and assert that the original beta dispatch has no Word Count registration.

Copy **`assets/word-count.png`** unchanged to **`src/renderer/public/extensions/icons/word-count.png`**. Its catalog URL is **`/extensions/icons/word-count.png`**. Recheck its 202,088-byte size and recorded SHA256. Bundle the license/attribution notices with the host. Rebuild Tezbar's native application, install the canonical bundled extension using its existing managed-package path, and verify its compiled installation marker/registry entry. Neither the manifest nor `native-v2.json` can supply executable code on its own. Retain V1 for fallback.

## Actual IPC and session contracts

Launch payload uses `argumentValues` (there are none to supply) and the host-provided `payload.preferences` object (no declared keys). Operations are the actual `extension:run-command`, `extension:invoke-action`, `extension:search-text-changed`, `extension:refresh-session`, `extension:load-more`, and `extension:dispose-session`.

The only adapter requests are reads:

| Route | Arguments | Successful value |
|---|---|---|
| `core:platform:selected-text` | `[]` | string |
| `clipboard:read` | `[]` | string |

Selection transport failures fall back as the own utility does. Malformed selection values produce a contract error; clipboard transport errors and nonstrings produce private retryable errors. A whitespace-only selection falls through after ECMAScript trim. Load notices preserve the source invocation order, including a nonempty whitespace-only selection notice before a clipboard fallback notice. Clipboard-only command never requests selection/OCR. Empty clipboard message remains exactly `Nothing to count in the clipboard`.

No external write/paste/open/hide effect is added. In particular SDK `copy` is `clipboard:write [text]`, SDK `open` is `shell:open [target]`; `core:platform:paste-text [text]` prepares the clipboard, hides/restores focus/waits/pastes, while `core:platform:paste []` uses a prepared clipboard. These are not invoked by this extension. If future source behavior requires an effect, it must validate a strict object acknowledgement: `ok === true`, `success` absent or true, reject contradictory/error-bearing/absent/null/boolean/malformed/transport results, sanitize errors, and checkpoint completed effects before subsequent fallible work. Uncertain nonidempotent effects require a deliberate retry, never automatic replay.

The task reports a real beta integration path where `window:hide []` performs a hide and returns null. That cannot satisfy strict acknowledgement and must never be accepted as success or replayed automatically. Captured `platform.rs` has an object acknowledgement in its local hide branch; that alone does not establish the acknowledgement through every real host/frontend path. This adapter avoids that dependency by presenting results in the supported visible view. Matching original HUD dismissal or a true overlay requires separately reviewed host integration and desktop QA; a fake router returning `{ok:true}` would not prove it works.

There is no native HUD/toast operation in `v2_sdk`. Raycast runtime hooks dispatch browser custom events; the native result protocol does not implement them as SDK routes. This adapter uses an ordinary supported Form result rather than inventing routes or claiming that no-view output displayed an overlay. It leaves the launcher visible. Clipboard summary grouping is en-US; the source's locale-dependent `toLocaleString()` in other OS locales remains a presentation difference.

## Form, binding and lifecycle details

Views use actual `type`/`props`/`children` nodes. `Form.TextArea` ID `text` and `Form.Checkbox` ID `include-whitespace` are stable. Controlled initialization uses `props.value`; callbacks use `props.actionId`, and the actual surface sends `formValues: {value}`. Primary submission/action-overlay execution sends the complete `{text, "include-whitespace"}` map. Secondary clear action can arrive without a map. Toggle stays first, clear second. Both source shortcuts are retained as metadata; pinned beta does not wire arbitrary action shortcut metadata to Cmd+T/Cmd+E (use the action menu). Icons on these action descriptors also lack a corresponding beta action type; no new renderer API is fabricated.

The actual parser/reconciliation function accepts every supplied controlled value. To preserve newer queued drafts, callback responses omit both controlled values; toggle controls only its checkbox and clear controls only the text it intentionally resets. Invalid inputs return an error without mutating committed output or invalidating legitimate IDs. There is only one source form, with no invented navigation stack; Back delegates to the outer surface and does not mutate the adapter draft before disposal. Reopening starts fresh, matching source state rather than claiming persistence.

Action IDs combine an OS-random process nonce, a per-launch UUID and the bound operation. They cannot be used across sessions, old launches, expired processes, or disposed states. No event-supplied computed output/copy target is accepted; there is no source copy action. Search/load-more/refresh return `sdk::unchanged()` without state mutation, allocating IDs, reading text, or replaying effects. This is safe with the beta's staged/discardable search clones and heartbeat behavior. Disposal clears all state. Read failures retain any prior computation, retry is explicit, and oversize edits leave committed statistics untouched.

The source has no storage API or saved preferences. No persistence calls/migration are introduced. Separate temporary-file SDK tests verify process-atomic updates, unrelated-key preservation, concurrent increments, rejected-transaction rollback and corruption rejection, without touching real extension storage.

## Remaining integration QA

After review, registration and native rebuild, separately test macOS and Windows installation, source-selection permissions/fallback, clipboard read/error/empty cases, form input/reconciliation, action menus, window visibility, focus and result dismissal. Verify that the UI clearly presents a result view rather than a true overlay. Real shortcuts, locale presentation, true HUD/toast/overlay and focus behavior are documented beta limitations, not parser test passes. Both platform verification states remain `not-run` until real QA evidence exists.
