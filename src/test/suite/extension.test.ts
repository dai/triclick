import * as assert from 'assert';
import * as vscode from 'vscode';
import { adjustSelection } from '../../selectionAdjuster';

suite('Extension Integration Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('拡張機能がロードされ、アクティベートできること', async () => {
    const ext = vscode.extensions.getExtension('dai.select-line-without-newline');
    // パッケージ名やIDが取得できるか
    if (ext) {
      await ext.activate();
      assert.strictEqual(ext.isActive, true);
    }
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
});
