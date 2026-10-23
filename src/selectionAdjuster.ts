export interface SelectionAdjusterOptions {
  enabled: boolean;
  handleMultiLine: boolean;
}

export interface MinimalPosition {
  readonly line: number;
  readonly character: number;
}

export interface MinimalSelection {
  readonly start: MinimalPosition;
  readonly end: MinimalPosition;
  readonly anchor: MinimalPosition;
  readonly active: MinimalPosition;
  readonly isEmpty: boolean;
  readonly isReversed: boolean;
}

export interface MinimalLine {
  readonly range: {
    readonly end: MinimalPosition;
  };
  readonly text: string;
}

export interface MinimalDocument {
  lineAt(line: number): MinimalLine;
}

export type SelectionFactory<T> = (anchor: MinimalPosition, active: MinimalPosition) => T;

/**
 * トリプルクリック（または行番号クリック）による行選択かどうかを判定し、
 * 行末の改行文字（\r\n または \n）を含めないよう補正した選択範囲を返す。
 * 補正が不要な場合は null を返す。
 */
export function adjustSelectionCore<T>(
  document: MinimalDocument,
  selection: MinimalSelection,
  options: SelectionAdjusterOptions,
  createSelection: SelectionFactory<T>
): T | null {
  if (!options.enabled || selection.isEmpty) {
    return null;
  }

  const { start, end, isReversed } = selection;

  // 行頭から始まり、行頭で終わる選択であるか（トリプルクリックの標準パターン）
  if (start.character !== 0 || end.character !== 0) {
    return null;
  }

  const lineDiff = end.line - start.line;
  if (lineDiff <= 0) {
    return null;
  }

  // 単一行（lineDiff === 1）または 複数行許可時の複数行（lineDiff > 1）
  if (lineDiff === 1 || (options.handleMultiLine && lineDiff > 1)) {
    const targetLineIndex = end.line - 1;
    const targetLine = document.lineAt(targetLineIndex);
    const newEnd = targetLine.range.end;

    if (isReversed) {
      // 逆方向ドラッグ: anchor が end側、active が start側
      return createSelection(newEnd, start);
    } else {
      // 順方向: anchor が start側、active が end側
      return createSelection(start, newEnd);
    }
  }

  return null;
}

/**
 * カーソル位置、または既存の選択範囲が属する行全体を、
 * 最終行の行末の改行を含めずに選択する範囲を返す。
 * キーボードから呼び出せるコマンド用で、マウス選択の補正とは独立している。
 * 選択範囲の終端が行頭にある場合は、その行は範囲に含めない
 * （行単位の選択が次行の先頭まで伸びているだけのため）。
 */
export function expandToLinesWithoutNewlineCore<T>(
  document: MinimalDocument,
  selection: MinimalSelection,
  createSelection: SelectionFactory<T>
): T {
  const startLine = selection.start.line;
  let endLine = selection.end.line;
  if (!selection.isEmpty && selection.end.character === 0 && endLine > startLine) {
    endLine -= 1;
  }

  const start: MinimalPosition = { line: startLine, character: 0 };
  const end = document.lineAt(endLine).range.end;
  return createSelection(start, end);
}
