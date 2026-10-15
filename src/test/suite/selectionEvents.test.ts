import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';
import * as vscode from 'vscode';
import { adjustSelection } from '../../selectionAdjuster';

// Load a fresh extension module without registering a second real VS Code listener.
function createHarness(document: vscode.TextDocument, initialSelections: vscode.Selection[]) {
  let listener: ((event: vscode.TextEditorSelectionChangeEvent) => void) | undefined;
  let writes = 0;
  let selections = initialSelections;
  const settings: Record<string, boolean> = { enabled: true, handleMultiLine: true };
  const disposable = { dispose() {} };
  const subscriptions: vscode.Disposable[] = [];
  const editor = {
    document,
    get selections() { return selections; },
    set selections(value: vscode.Selection[]) { writes++; selections = value; }
  };
  const extensionExports: { activate?: (context: unknown) => void } = {};
  const mockVscode = {
    TextEditorSelectionChangeKind: vscode.TextEditorSelectionChangeKind,
    window: {
      onDidChangeTextEditorSelection(callback: typeof listener) {
        listener = callback;
        return disposable;
      }
    },
    workspace: {
      getConfiguration(section: string) {
        assert.strictEqual(section, 'selectLineWithoutNewline');
        return { get: (key: string, fallback: boolean) => settings[key] ?? fallback };
      }
    }
  };
  const extensionPath = path.resolve(__dirname, '../../extension.js');
  vm.runInNewContext(fs.readFileSync(extensionPath, 'utf8'), {
    exports: extensionExports,
    require(id: string) {
      if (id === 'vscode') { return mockVscode; }
      if (id === './selectionAdjuster') { return { adjustSelection }; }
      throw new Error(`Unexpected dependency: ${id}`);
    }
  }, { filename: extensionPath });
  assert.ok(extensionExports.activate);
  extensionExports.activate({ subscriptions });
  assert.ok(listener);
  assert.strictEqual(subscriptions[0], disposable);
  return {
    editor,
    settings,
    get writes() { return writes; },
    emit(kind: vscode.TextEditorSelectionChangeKind | undefined) {
      listener!({ textEditor: editor as unknown as vscode.TextEditor, selections, kind });
    }
  };
}

suite('Selection event handling', () => {
  for (const kind of [vscode.TextEditorSelectionChangeKind.Keyboard, vscode.TextEditorSelectionChangeKind.Command, undefined]) {
    test(`Non-mouse event ${kind} preserves a full-line selection`, async () => {
      const doc = await vscode.workspace.openTextDocument({ content: 'first\nsecond' });
      const selection = new vscode.Selection(0, 0, 1, 0);
      const harness = createHarness(doc, [selection]);
      harness.emit(kind);
      assert.strictEqual(harness.writes, 0);
      assert.strictEqual(harness.editor.selections[0], selection);
    });
  }

  test('Mouse events adjust matching selections and preserve other cursors', async () => {
    const doc = await vscode.workspace.openTextDocument({ content: 'first\nsecond\nthird\nlast' });
    const partial = new vscode.Selection(3, 1, 3, 3);
    const harness = createHarness(doc, [new vscode.Selection(0, 0, 1, 0), new vscode.Selection(3, 0, 1, 0), partial]);
    harness.emit(vscode.TextEditorSelectionChangeKind.Mouse);
    assert.strictEqual(harness.writes, 1);
    assert.strictEqual(harness.editor.selections.length, 3);
    assert.strictEqual(doc.getText(harness.editor.selections[0]), 'first');
    assert.strictEqual(doc.getText(harness.editor.selections[1]), 'second\nthird');
    assert.strictEqual(harness.editor.selections[1].isReversed, true);
    assert.strictEqual(harness.editor.selections[2], partial);
  });

  test('Changing enabled is respected on the next event', async () => {
    const doc = await vscode.workspace.openTextDocument({ content: 'first\nsecond' });
    const harness = createHarness(doc, [new vscode.Selection(0, 0, 1, 0)]);
    harness.settings.enabled = false;
    harness.emit(vscode.TextEditorSelectionChangeKind.Mouse);
    assert.strictEqual(harness.writes, 0);
    harness.settings.enabled = true;
    harness.emit(vscode.TextEditorSelectionChangeKind.Mouse);
    assert.strictEqual(harness.writes, 1);
    assert.strictEqual(doc.getText(harness.editor.selections[0]), 'first');
  });

  test('Disabling multi-line handling preserves a multi-line mouse selection', async () => {
    const doc = await vscode.workspace.openTextDocument({ content: 'first\nsecond\nlast' });
    const selection = new vscode.Selection(0, 0, 2, 0);
    const harness = createHarness(doc, [selection]);
    harness.settings.handleMultiLine = false;
    harness.emit(vscode.TextEditorSelectionChangeKind.Mouse);
    assert.strictEqual(harness.writes, 0);
    assert.strictEqual(harness.editor.selections[0], selection);
  });
});
