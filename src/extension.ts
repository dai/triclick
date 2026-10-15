import * as vscode from 'vscode';
import { adjustSelection, SelectionAdjusterOptions } from './selectionAdjuster';

let isAdjusting = false;

function getOptions(): SelectionAdjusterOptions {
  const config = vscode.workspace.getConfiguration('selectLineWithoutNewline');
  return {
    enabled: config.get<boolean>('enabled', true),
    handleMultiLine: config.get<boolean>('handleMultiLine', true)
  };
}

export function activate(context: vscode.ExtensionContext) {
  const selectionDisposable = vscode.window.onDidChangeTextEditorSelection((event) => {
    // 自身の補正による再帰呼び出しを防止
    if (isAdjusting) {
      return;
    }

    // マウスによる選択イベント（トリプルクリックやガタークリック、ドラッグ等）のみを対象とする
    if (event.kind !== vscode.TextEditorSelectionChangeKind.Mouse) {
      return;
    }

    const editor = event.textEditor;
    if (!editor || !editor.document) {
      return;
    }

    const options = getOptions();
    if (!options.enabled) {
      return;
    }

    let hasChanges = false;
    const newSelections = editor.selections.map((selection) => {
      const adjusted = adjustSelection(editor.document, selection, options);
      if (adjusted) {
        hasChanges = true;
        return adjusted;
      }
      return selection;
    });

    if (hasChanges) {
      isAdjusting = true;
      try {
        editor.selections = newSelections;
      } finally {
        isAdjusting = false;
      }
    }
  });

  context.subscriptions.push(selectionDisposable);
}

export function deactivate() {}
