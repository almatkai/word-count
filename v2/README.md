# Word Count — Rust Native V2

Standalone offline Rust counting engine plus a concrete compiled-in adapter for Tezbar beta `fd300e276356587726566026f072563eb9c34cb1`. V1 remains byte-for-byte intact in the repository root, apart from its README discovery link. Nothing here installs or modifies the host automatically.

- [Integration and exact host changes required](INTEGRATION.md)
- [Validation evidence and reproducible commands](VALIDATION.md)
- [Source, library, icon and license provenance](PROVENANCE.json)
- [Credits, licenses and unresolved evidence](NOTICES.md)

The source is this repository at `472bc57b5b3d4eafbdfc7e5abffb52e11bdac04e`, not the older Raycast behavior described by the V1 README. All three actual commands are ported:

| Command | Source behavior | Native V2 behavior |
|---|---|---|
| `count` / Count | Selection, falling back to clipboard; live form | Same source priority, trimming, counters, default whitespace **enabled**, toggle then clear actions |
| `count-screenshot` / Count Clipboard Text | Clipboard only; statistics in a HUD | Same text and statistics, displayed in a visible result form |
| `count-overlay` / Word Count in Overlay | Selection then clipboard; `Word Count: N` toast | Same word count and message, displayed in a visible result form |

The last two view adaptations are deliberate: this beta has no Native V2 HUD/toast/true overlay API. They keep the launcher visible. They do not perform OCR, hide the window, claim an overlay was displayed, or return a misleading no-view success. Clipboard summary number formatting is pinned to **en-US**, matching the recorded oracle locale; other default OS locales remain a documented presentation gap.

The original 202,088-byte icon is unchanged: SHA256 `94f23ca4f94a07e1cbebd9b3f44f105ca231b88662c26aaf63ca221f6d45db7f`.

## Engine and limits

`src/lib.rs` exposes `count(&str, bool)` and `count_utf16(&[u16], bool)`. The latter also tests unpaired surrogate behavior; host JSON strings must be valid Unicode. No grapheme or linguistic segmenter is substituted for the source algorithm. Characters decode surrogate pairs; word traversal is by UTF-16 unit, preserves the source's supplementary CJK limitation, removes its exact Western punctuation set, and uses ECMAScript whitespace. Paragraphs count LF runs, including CRLF peculiarities. Sentences reproduce `/[.?!…]+./g`, with its greedy backtracking and line-terminator exclusions. Reading/speaking times use ceilings at 275/180 words per minute.

The explicit limit is 1,048,576 UTF-16 units (and a preallocation guard at 4,194,304 UTF-8 bytes). Exceeding it returns an error; no text is truncated. Initial acquisition failures render a private error with an explicit retry. Invalid edits leave committed text/statistics and legitimate action bindings intact. No clipboard, selection text, host path, or transport error is echoed in error messages.

There are no declared preferences or launch arguments, no copy/paste/open actions, and no source storage. Drafts live only in the session, just as V1's React state does. No legacy storage migration or new persistence is introduced. SDK process-atomic storage behavior is tested independently in temporary directories.

## Local verification

Install Rust stable and 1.85.0 with Clippy/rustfmt, the `x86_64-pc-windows-gnu` targets for both, Node (recorded: 26.7.0), and Python 3.9+. Prefetch dependencies once with `cargo fetch --locked` and, after materialization, the fixture crate's corresponding command. Then:

```sh
python3 scripts/materialize-beta.py
python3 scripts/validate.py
python3 scripts/check-package.py
python3 scripts/audit.py
```

Validation Node code executes the exact own TS/TSX and actual locked compiler/React libraries; none is a runtime fallback. The host ships only compiled Rust. Host registration/rebuild, installation, and real macOS/Windows UI/clipboard/selection/focus/overlay QA remain **not-run** on both manifest verification entries.
