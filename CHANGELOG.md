# Changelog

## Unreleased

- Align README demo previews so clicking the GIF opens the MP4, and match the Marketplace / settings copy to the README (gutter click, multi-line selection wording).
- Show the current on/off state in the status bar and toggle automatic adjustment by clicking it.
- Write the toggle to the scope that currently defines `selectLineWithoutNewline.enabled`, so a workspace override no longer makes the toggle appear to do nothing.
- Replace the toggle's information message with the status bar indicator (with localized tooltips).
- Add the select-line command to the editor context menu and hide it from the Command Palette when no text editor is open.

## 0.0.3

- Add commands: toggle automatic adjustment from the Command Palette, and select the current line(s) without a trailing newline as an explicit (keyboard-assignable) command.
- Localize the extension description and setting descriptions (English and Japanese) with package.nls files.
- Point homepage, issue and repository URLs to the current repository, dai/triclick.
- Remove local work notes (tasks/) from the repository and ignore that directory.
- Add Dependabot for npm and GitHub Actions, scope the CI audit to production dependencies, and add ESLint.
- Add a tag-driven release workflow (test, package, GitHub Release, and Marketplace publish when VSCE_PAT is configured).

## 0.0.2

- Rename the Marketplace display name to TriClick and add an extension icon.

## 0.0.1

- Exclude the final newline from mouse selections spanning complete lines.
- Support forward, reversed, and multiple selections with LF and CRLF documents.
- Add settings to disable adjustment or limit it to single-line selections.
- Leave keyboard and command selections unchanged.

See README for the mouse-selection heuristic and empty-line copy limitations.
