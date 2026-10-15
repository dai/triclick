# Review and publication plan

## TriClick 0.0.2 branding update

- [x] Rename Marketplace display name to TriClick while keeping the extension ID stable.
- [x] Add the extension icon and update Japanese/English README plus changelog.
- [x] Run tests, audit, package, and inspect the VSIX contents.
- [x] Push to GitHub and publish version 0.0.2 to Marketplace.
- [ ] Verify that the Marketplace version history and icon have finished updating.

### Review

- Published `dai.select-line-without-newline` 0.0.2 with `icon.png`; extension identifier remains stable.
- Marketplace listing title now shows TriClick, and the Marketplace publication endpoint rejects a repeat upload as “0.0.2 already exists.” However, the public version history, README, and icon still show the old listing during this check; `vsce show` also reports 0.0.1. Leave this verification open until the Marketplace finishes propagating the new package.
- GitHub release v0.0.2 includes the packaged VSIX. Its SHA-256 matches the local package: `d70f9be16f713cfda8ce751ab1c9d2d6c62f8457d7fc69f7e1d9b708a3a80703`.
- `npm test`: 19 passing; `npm audit --omit=dev`: 0 vulnerabilities; VSIX includes the 128x128 icon; GitHub CI passed all six OS/version jobs.
- Marketplace browser upload could not set a file because Chrome's Codex extension lacks file-URL access; the same VSIX was published successfully with the authenticated VSCE CLI.

## Scope and acceptance criteria

Preserve the existing mouse-selection behavior and settings. Review all source,
tests, package metadata, dependencies, and packaged files. Fix confirmed defects
with regression coverage. Support VS Code 1.90.0 and current stable. Publish the
reviewed source to dai/vscode-select-line-without-newline and version 0.0.1 to
Visual Studio Marketplace using the existing dai publisher if authorized there.
Never record authentication secrets in repository files or logs.

## Checklist

- [x] Review implementation, test coverage, dependency audit, and publishing prerequisites.
- [x] Fix confirmed issues and document selection limitations.
- [x] Run unit tests and extension-host tests on minimum and stable VS Code.
- [x] Build VSIX and inspect its contents; add reproducible CI and release notes.
- [x] Create GitHub repository, push reviewed source, verify CI, and attach VSIX to release.
- [x] Publish to Marketplace and verify the published extension metadata and version.

## Review focus

- Empty lines, LF/CRLF, reversed and multiple selections.
- Keyboard/command events must remain unchanged.
- Activation tests must fail if the extension is missing.
- Declared minimum VS Code and installed API typings must agree.
- Exclude tests, development files, and secrets from the VSIX.

## Review results

- Fixed an activation test that silently passed when the extension was missing.
- Added event-handler coverage and LF/CRLF, reversed and final-line checks.
- Added compilation before standalone unit tests to avoid stale outputs.
- Pinned API typings to the declared minimum VS Code 1.90.0.
- Updated development tools: npm audit now reports 0 vulnerabilities (previously 9 high).
- Documented the mouse-range heuristic and empty-selection clipboard limitation.
- Stable VS Code 1.142.0: 19 tests passed. Unit tests: 7 passed.
- Minimum VS Code 1.90.0: 19 tests passed.
- Mocha 12 cannot load in the minimum host's older Node runtime. Use Mocha 11
  with scoped overrides to patched diff >=8.0.3 and serialize-javascript >=7.0.5.
  These are test-only dependencies; revisit the overrides when upgrading Mocha.
- VSIX allowlist inspection contains only manifest, README, license, changelog,
  and two runtime JavaScript files; no runtime dependencies are shipped.
- GitHub CLI is authenticated as dai. Marketplace publisher dai Owner access was
  verified, and a fresh PAT was confirmed through vsce verify-pat.
- Physical mouse-drag behavior has not yet been manually validated.
- Initial GitHub CI passed 5/6 jobs. macOS stable failed before tests because
  test-electron 2.5.2 expected the old Electron executable filename. Updated to
  test-electron 3.1.0, which resolves the executable from the app bundle.
- The updated runner exposed macOS's 103-character Unix socket path limit in
  this long repository checkout. Test profiles now use unique OS temp directories.
- Final CI: all six jobs passed at https://github.com/dai/vscode-select-line-without-newline/actions/runs/38689759614.
- GitHub release: https://github.com/dai/vscode-select-line-without-newline/releases/tag/v0.0.1.
- Corrected the invalid `Keybindings` Marketplace category to `Other`. The first
  publish attempt was rejected before publication; the corrected VSIX published
  successfully as dai.select-line-without-newline 0.0.1.
- Marketplace metadata from `vsce show` confirms version 0.0.1 and category Other.
- Replaced the GitHub Release VSIX with the corrected package. Its SHA256 is
  64d297601616a060455fb3a2e206e34e1426d340adfe04a2954d169d6635a9ad.
- Final CI on the corrected manifest: all six jobs passed at
  https://github.com/dai/vscode-select-line-without-newline/actions/runs/38691297612.
- The Marketplace item URL returned 404 in a direct browser check immediately
  after `vsce publish`, while CLI metadata already showed the published version.
  Verify the page again after Marketplace propagation.
- PAT migration copied the expired credential. After the user entered a newly
  created PAT, `vsce verify-pat dai` succeeded. The first VSIX publish attempt
  exposed the invalid manifest category `Keybindings`; it was removed because the
  extension does not contribute keyboard mappings. The valid `Other` category remains.
