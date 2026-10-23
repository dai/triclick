import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  adjustSelectionCore,
  expandToLinesWithoutNewlineCore,
  MinimalPosition,
  SelectionAdjusterOptions
} from '../../selectionAdjuster';

function adjustSelection(
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  options: SelectionAdjusterOptions
): vscode.Selection | null {
  return adjustSelectionCore(
    doc,
    selection,
    options,
    (anchor: MinimalPosition, active: MinimalPosition) =>
      new vscode.Selection(anchor.line, anchor.character, active.line, active.character)
  );
}

suite('Extension Integration Test Suite', () => {
  test('拡張機能がロードされ、アクティベートできること', async () => {
    const ext = vscode.extensions.getExtension('dai.select-line-without-newline');
    assert.ok(ext, 'The extension must be available in the extension host');
    await ext.activate();
    assert.strictEqual(ext.isActive, true);
  });

  test('実ドキュメント上で adjustSelection が期待通り動作すること', async () => {
    const doc = await vscode.workspace.openTextDocument({
      content: 'Line 1: Hello World\nLine 2: Test Line\nLine 3: End'
    });

    // 0行目のトリプルクリック想定: (0, 0) から (1, 0)
    const selection = new vscode.Selection(0, 0, 1, 0);
    const adjusted = adjustSelection(doc, selection, { enabled: true, handleMultiLine: true });

    assert.ok(adjusted);
    assert.strictEqual(adjusted.start.line, 0);
    assert.strictEqual(adjusted.start.character, 0);
    assert.strictEqual(adjusted.end.line, 0);
    assert.strictEqual(adjusted.end.character, 19); // "Line 1: Hello World" は19文字
  });

  for (const eol of ['\n', '\r\n']) {
    test(`Selected text excludes only the final ${JSON.stringify(eol)} newline`, async () => {
      const doc = await vscode.workspace.openTextDocument({ content: ['first', 'second', 'last'].join(eol) });
      const options = { enabled: true, handleMultiLine: true };
      const single = adjustSelection(doc, new vscode.Selection(0, 0, 1, 0), options);
      assert.ok(single);
      assert.strictEqual(doc.getText(single), 'first');

      const reversed = adjustSelection(doc, new vscode.Selection(2, 0, 0, 0), options);
      assert.ok(reversed);
      assert.strictEqual(reversed.isReversed, true);
      assert.strictEqual(doc.getText(reversed), ['first', 'second'].join(eol));
      assert.strictEqual(reversed.anchor.line, 1);
      assert.strictEqual(reversed.anchor.character, 'second'.length);
      assert.strictEqual(reversed.active.line, 0);
      assert.strictEqual(reversed.active.character, 0);
    });
  }

  test('コマンドが登録されていること', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('selectLineWithoutNewline.toggleEnabled'));
    assert.ok(commands.includes('selectLineWithoutNewline.selectLine'));
  });

  test('expandToLinesWithoutNewlineCore expands a cursor to its line without a newline', async () => {
    const doc = await vscode.workspace.openTextDocument({ content: 'first\nsecond\nlast' });
    const expanded = expandToLinesWithoutNewlineCore(
      doc,
      new vscode.Selection(1, 3, 1, 3),
      (anchor, active) => new vscode.Selection(anchor.line, anchor.character, active.line, active.character)
    );
    assert.strictEqual(doc.getText(expanded), 'second');
  });

  test('A final line without a newline remains unchanged', async () => {
    const doc = await vscode.workspace.openTextDocument({ content: 'first\nlast' });
    const selection = new vscode.Selection(1, 0, 1, 4);
    assert.strictEqual(adjustSelection(doc, selection, { enabled: true, handleMultiLine: true }), null);
    assert.strictEqual(doc.getText(selection), 'last');
  });

  test('A trailing empty line preserves the preceding internal newline', async () => {
    const doc = await vscode.workspace.openTextDocument({ content: 'first\n\nlast' });
    const adjusted = adjustSelection(doc, new vscode.Selection(0, 0, 2, 0), { enabled: true, handleMultiLine: true });
    assert.ok(adjusted);
    assert.strictEqual(doc.getText(adjusted), 'first\n');
    assert.strictEqual(adjusted.end.line, 1);
    assert.strictEqual(adjusted.end.character, 0);
  });
});
