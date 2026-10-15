# Review and publication plan

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
- [ ] Create GitHub repository, push reviewed source, verify CI, and attach VSIX to release.
- [ ] Publish to Marketplace and verify the public listing (or record the exact authentication blocker).

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
- GitHub CLI is authenticated as dai. Marketplace CLI token is expired;
  the user signed into the browser and publisher dai Owner access was verified.
- Physical mouse-drag behavior has not yet been manually validated.
