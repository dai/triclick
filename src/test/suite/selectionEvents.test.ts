import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';
import * as vscode from 'vscode';
import { adjustSelectionCore, expandToLinesWithoutNewlineCore } from '../../selectionAdjuster';

interface MockStatusBarItem {
  text: string;
  tooltip: unknown;
  command?: string;
  backgroundColor: unknown;
  show(): void;
  hide(): void;
  dispose(): void;
}

interface SettingUpdate {
  key: string;
  value: unknown;
  target: vscode.ConfigurationTarget;
}

// Load a fresh extension module without registering a second real VS Code listener.
function createHarness(document: vscode.TextDocument, initialSelections: vscode.Selection[]) {
  let listener: ((event: vscode.TextEditorSelectionChangeEvent) => void) | undefined;
  let writes = 0;
  let selections = initialSelections;
  let workspaceValue: boolean | undefined;
  const settings: Record<string, boolean> = { enabled: true, handleMultiLine: true };
  const disposable = { dispose() {} };
  const subscriptions: vscode.Disposable[] = [];
  const statusBarItems: MockStatusBarItem[] = [];
  const settingUpdates: SettingUpdate[] = [];
  const handlers: Record<string, () => unknown> = {};
  const editor = {
    document,
    get selections() { return selections; },
    set selections(value: vscode.Selection[]) { writes++; selections = value; }
  };
  const extensionExports: { activate?: (context: unknown) => void } = {};
  const mockVscode = {
    Selection: vscode.Selection,
    ThemeColor: vscode.ThemeColor,
    StatusBarAlignment: vscode.StatusBarAlignment,
    ConfigurationTarget: vscode.ConfigurationTarget,
    TextEditorSelectionChangeKind: vscode.TextEditorSelectionChangeKind,
    l10n: {
      t: (message: string) => message
    },
    commands: {
      registerCommand(id: string, callback: () => unknown) {
        handlers[id] = callback;
        return disposable;
      }
    },
    window: {
      onDidChangeTextEditorSelection(callback: typeof listener) {
        listener = callback;
        return disposable;
      },
      createStatusBarItem() {
        const item: MockStatusBarItem = {
          text: '',
          tooltip: undefined,
          command: undefined,
          backgroundColor: undefined,
          show() {},
          hide() {},
          dispose() {}
        };
        statusBarItems.push(item);
        return item;
      }
    },
    workspace: {
      getConfiguration(section: string) {
        assert.strictEqual(section, 'selectLineWithoutNewline');
        return {
          get: (key: string, fallback: boolean) => settings[key] ?? fallback,
          inspect: (key: string) =>
            key === 'enabled' && workspaceValue !== undefined ? { workspaceValue } : {},
          update: async (key: string, value: unknown, target: vscode.ConfigurationTarget) => {
            settingUpdates.push({ key, value, target });
            settings[key] = value as boolean;
          }
        };
      },
      onDidChangeConfiguration() {
        return disposable;
      }
    }
  };
  const extensionPath = path.resolve(__dirname, '../../extension.js');
  vm.runInNewContext(fs.readFileSync(extensionPath, 'utf8'), {
    exports: extensionExports,
    require(id: string) {
      if (id === 'vscode') { return mockVscode; }
      if (id === './selectionAdjuster') { return { adjustSelectionCore, expandToLinesWithoutNewlineCore }; }
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
    statusBarItems,
    settingUpdates,
    get writes() { return writes; },
    setWorkspaceValue(value: boolean | undefined) { workspaceValue = value; },
    async runCommand(id: string) {
      const handler = handlers[id];
      assert.ok(handler, `${id} must be registered`);
      await handler();
    },
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

  test('Status bar shows the current enabled state', async () => {
    const doc = await vscode.workspace.openTextDocument({ content: 'first\nsecond' });
    const harness = createHarness(doc, []);
    assert.strictEqual(harness.statusBarItems.length, 1);
    assert.strictEqual(harness.statusBarItems[0].text, '$(check) TriClick');
    assert.strictEqual(harness.statusBarItems[0].command, 'selectLineWithoutNewline.toggleEnabled');
  });

  test('Toggle writes to the workspace scope when the workspace overrides enabled', async () => {
    const doc = await vscode.workspace.openTextDocument({ content: 'first\nsecond' });
    const harness = createHarness(doc, []);
    harness.settings.enabled = false;
    harness.setWorkspaceValue(false);

    await harness.runCommand('selectLineWithoutNewline.toggleEnabled');

    assert.deepStrictEqual(harness.settingUpdates, [
      { key: 'enabled', value: true, target: vscode.ConfigurationTarget.Workspace }
    ]);
    assert.strictEqual(harness.statusBarItems[0].text, '$(check) TriClick');
  });

  test('Toggle falls back to the global scope when no override exists', async () => {
    const doc = await vscode.workspace.openTextDocument({ content: 'first\nsecond' });
    const harness = createHarness(doc, []);
    harness.settings.enabled = true;

    await harness.runCommand('selectLineWithoutNewline.toggleEnabled');

    assert.deepStrictEqual(harness.settingUpdates, [
      { key: 'enabled', value: false, target: vscode.ConfigurationTarget.Global }
    ]);
    assert.strictEqual(harness.statusBarItems[0].text, '$(circle-slash) TriClick');
  });
});
