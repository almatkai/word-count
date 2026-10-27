# Credits and license evidence

Word Count's original Raycast author is **itsmingjie (Mingjie Jiang)**. Contributors at Raycast pin `6734d85992290066fd31a7f5bee3cca3d3545a1a`: **koayon, chrismessina, litomore, aryan_thatte**. The own repository author is **almatkai**, and its own manifest also retains past contributor **danulqua**. Both byte-exact manifests are included. Root Native V2 `author` is unsupported by the pinned schema, so credits are in its description and these notices/provenance.

The original icon was downloaded from that pinned Raycast path, checked for size/SHA256 and copied without editing. It is identical to the own V1 icon. The original extension and own repository contain the actual **MIT License, Copyright (c) 2022 Mingjie Jiang**. Both original texts are retained under `fixtures/` and `licenses/`. No separate asset-specific license was found in that captured extension; the accompanying extension license is the evidence, rather than a newly inferred icon license.

The counting source explicitly credits a modified `@RadLikeWhoa/Countable` implementation under MIT, and performance work by `@epmatsw`. Those comments remain byte-exact in the own source fixture. The Rust implementation is a new translation of that own source, not a claim about an independently pinned Countable release. No extra third-party counting library is used. New Rust source follows the own MIT license.

Captured Tezbar beta files retain the actual root **Apache-2.0** license. Its separately captured Color Picker example retains its explicit upstream MIT license file. Beta fixtures are unmodified. Harness templates are new test scaffolding with clearly labeled Tauri/router/registration/installation seams. They do not redistribute Tauri or fabricate working desktop integration.

The exact locked **TypeScript 5.9.3** compiler and **React 19.2.3** runtime/JSX files execute the own source oracle. TypeScript's actual Apache license and complete third-party notices are retained; React's actual MIT license is retained. TypeScript's supplemental notices cover MIT, Unicode-DFS-2016, W3C Software and Document, WHATWG CC-BY-4.0, the W3C Community Final Specification Agreement (recorded with a LicenseRef), and Khronos' MIT-form grant. These full texts have not been replaced by a generic dependency-name assumption. The conservative supplied-source/notice aggregate is in `licenses/PACKAGE.txt` and `LICENSES.json`, and Cargo uses that license file.

The full Draft 2020-12 schema validator is pinned **Ajv 8.17.1** with its own lock and actual licenses. Its fast-uri dependency **3.1.9** uses **BSD-3-Clause**, not MIT; fast-deep-equal 3.1.3, json-schema-traverse 1.0.0 and require-from-string 2.0.2 include their actual MIT texts. They are validation fixtures only. Root ignore exceptions explicitly expose these libraries' `dist/` and `node_modules/` files to Git; packaging checks confirm their presence after extraction.

`RUST-LICENSES.json` records the actual registry package license expressions, MSRVs and copied license/notice files for both locks' resolved dependencies. Use MIT where offered, Apache-2.0 where required, and retain Unicode-3.0 for unicode-ident. Full source fixture hashes and full-text license hashes are in `PROVENANCE.json`.

## Unresolved evidence

The installed legacy `@raycast/api 1.104.1` and `@raycast/utils 2.2.2` package metadata declares MIT but their published package directories contain no full license text. Their package metadata/own lock are captured, and the packages are used only for the disposable V1 check; their executable code is not shipped in V2. This is metadata evidence, not independently verified full-text licensing.

The harness lock's **r-efi 6.0.0** (an excluded UEFI target dependency of getrandom) declares MIT OR Apache-2.0 OR LGPL-2.1-or-later but has no license file in the actual published registry source inspected. Its unresolved full-text evidence is recorded. It is not compiled on macOS/Windows and its implementation source is not redistributed here. No claim is made that an unselected dependency's name proves its license.

The upstream Countable link in the own source has no pinned revision; this port relies on the own repository's actual MIT license and retained attribution, without claiming an independently verified Countable source snapshot. Host vendoring/release reviewers should retain all applicable notices and assess these evidence gaps explicitly.
