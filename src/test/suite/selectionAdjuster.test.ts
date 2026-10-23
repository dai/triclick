import * as assert from 'assert';
import {
  adjustSelectionCore,
  expandToLinesWithoutNewlineCore,
  MinimalDocument,
  MinimalLine,
  MinimalPosition,
  MinimalSelection
} from '../../selectionAdjuster';

interface MockSelection {
  anchor: MinimalPosition;
  active: MinimalPosition;
  start: MinimalPosition;
  end: MinimalPosition;
  isEmpty: boolean;
  isReversed: boolean;
}

function createMockSelection(
  anchorLine: number,
  anchorChar: number,
  activeLine: number,
  activeChar: number
): MockSelection {
  const isReversed =
    anchorLine > activeLine || (anchorLine === activeLine && anchorChar > activeChar);

  const start = isReversed
    ? { line: activeLine, character: activeChar }
    : { line: anchorLine, character: anchorChar };
  const end = isReversed
    ? { line: anchorLine, character: anchorChar }
    : { line: activeLine, character: activeChar };

  return {
    anchor: { line: anchorLine, character: anchorChar },
    active: { line: activeLine, character: activeChar },
    start,
    end,
    isEmpty: start.line === end.line && start.character === end.character,
    isReversed
  };
}

function createMockDocument(lines: string[]): MinimalDocument {
  return {
    lineAt(lineIndex: number): MinimalLine {
      const text = lines[lineIndex] ?? '';
      return {
        range: {
          end: { line: lineIndex, character: text.length }
        },
        text
      };
    }
  };
}

suite('SelectionAdjuster Test Suite', () => {
  const sampleDoc = createMockDocument([
    'const hello = "world";', // line 0 (length 22)
    'function test() {',      // line 1 (length 17)
    '',                       // line 2 (empty, length 0)
    '  return 123;',          // line 3 (length 13)
    '}'                       // line 4 (length 1)
  ]);

  test('単一行のトリプルクリックで行末の改行が除外されること', () => {
    // 0行目をトリプルクリック: (0, 0) から (1, 0)
    const sel = createMockSelection(0, 0, 1, 0);
    const adjusted = adjustSelectionCore(
      sampleDoc,
      sel,
      { enabled: true, handleMultiLine: true },
      (anchor, active) => ({ anchor, active })
    );

    assert.ok(adjusted);
    assert.deepStrictEqual(adjusted.anchor, { line: 0, character: 0 });
    assert.deepStrictEqual(adjusted.active, { line: 0, character: 22 });
  });

  test('空行をトリプルクリックした場合は行頭カーソルになること', () => {
    // 2行目（空行）をトリプルクリック: (2, 0) から (3, 0)
    const sel = createMockSelection(2, 0, 3, 0);
    const adjusted = adjustSelectionCore(
      sampleDoc,
      sel,
      { enabled: true, handleMultiLine: true },
      (anchor, active) => ({ anchor, active })
    );

    assert.ok(adjusted);
    assert.deepStrictEqual(adjusted.anchor, { line: 2, character: 0 });
    assert.deepStrictEqual(adjusted.active, { line: 2, character: 0 });
  });

  test('複数行トリプルクリックドラッグ時に handleMultiLine=true で最終行の改行が除外されること', () => {
    // 0行目から1行目までトリプルクリックドラッグ: (0, 0) から (2, 0)
    const sel = createMockSelection(0, 0, 2, 0);
    const adjusted = adjustSelectionCore(
      sampleDoc,
      sel,
      { enabled: true, handleMultiLine: true },
      (anchor, active) => ({ anchor, active })
    );

    assert.ok(adjusted);
    assert.deepStrictEqual(adjusted.anchor, { line: 0, character: 0 });
    assert.deepStrictEqual(adjusted.active, { line: 1, character: 17 });
  });

  test('複数行トリプルクリックドラッグ時に handleMultiLine=false では補正されないこと', () => {
    // 0行目から1行目まで: (0, 0) から (2, 0)
    const sel = createMockSelection(0, 0, 2, 0);
    const adjusted = adjustSelectionCore(
      sampleDoc,
      sel,
      { enabled: true, handleMultiLine: false },
      (anchor, active) => ({ anchor, active })
    );

    assert.strictEqual(adjusted, null);
  });

  test('逆方向（下から上）トリプルクリックドラッグ時に anchor と active の向きが保持されること', () => {
    // 1行目の先頭から0行目の先頭へ逆方向ドラッグ: anchor=(1, 0), active=(0, 0)
    const sel = createMockSelection(1, 0, 0, 0);
    const adjusted = adjustSelectionCore(
      sampleDoc,
      sel,
      { enabled: true, handleMultiLine: true },
      (anchor, active) => ({ anchor, active })
    );

    assert.ok(adjusted);
    // 補正後: anchor は 0行目末尾 (0, 22)、active は 0行目先頭 (0, 0)
    assert.deepStrictEqual(adjusted.anchor, { line: 0, character: 22 });
    assert.deepStrictEqual(adjusted.active, { line: 0, character: 0 });
  });

  test('通常の部分選択（途中の文字から開始など）では補正されないこと', () => {
    // (0, 5) から (1, 0)
    const sel1 = createMockSelection(0, 5, 1, 0);
    const adjusted1 = adjustSelectionCore(
      sampleDoc,
      sel1,
      { enabled: true, handleMultiLine: true },
      (anchor, active) => ({ anchor, active })
    );
    assert.strictEqual(adjusted1, null);

    // (0, 0) から (0, 10)
    const sel2 = createMockSelection(0, 0, 0, 10);
    const adjusted2 = adjustSelectionCore(
      sampleDoc,
      sel2,
      { enabled: true, handleMultiLine: true },
      (anchor, active) => ({ anchor, active })
    );
    assert.strictEqual(adjusted2, null);

    // (0, 0) から (1, 5)
    const sel3 = createMockSelection(0, 0, 1, 5);
    const adjusted3 = adjustSelectionCore(
      sampleDoc,
      sel3,
      { enabled: true, handleMultiLine: true },
      (anchor, active) => ({ anchor, active })
    );
    assert.strictEqual(adjusted3, null);
  });

  test('行の途中のカーソルから、その行全体が改行なしで選択されること', () => {
    const sel = createMockSelection(1, 5, 1, 5);
    const expanded = expandToLinesWithoutNewlineCore(
      sampleDoc,
      sel,
      (anchor, active) => ({ anchor, active })
    );

    assert.deepStrictEqual(expanded.anchor, { line: 1, character: 0 });
    assert.deepStrictEqual(expanded.active, { line: 1, character: 17 });
  });

  test('部分選択は開始行から終了行までの行全体に広がること', () => {
    const sel = createMockSelection(0, 5, 3, 2);
    const expanded = expandToLinesWithoutNewlineCore(
      sampleDoc,
      sel,
      (anchor, active) => ({ anchor, active })
    );

    assert.deepStrictEqual(expanded.anchor, { line: 0, character: 0 });
    assert.deepStrictEqual(expanded.active, { line: 3, character: 13 });
  });

  test('終端が次行の行頭にある選択では、次行を含めないこと', () => {
    const sel = createMockSelection(0, 0, 2, 0);
    const expanded = expandToLinesWithoutNewlineCore(
      sampleDoc,
      sel,
      (anchor, active) => ({ anchor, active })
    );

    assert.deepStrictEqual(expanded.anchor, { line: 0, character: 0 });
    assert.deepStrictEqual(expanded.active, { line: 1, character: 17 });
  });

  test('enabled=false の場合は補正されないこと', () => {
    const sel = createMockSelection(0, 0, 1, 0);
    const adjusted = adjustSelectionCore(
      sampleDoc,
      sel,
      { enabled: false, handleMultiLine: true },
      (anchor, active) => ({ anchor, active })
    );
    assert.strictEqual(adjusted, null);
  });
});
