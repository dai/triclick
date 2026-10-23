import * as vscode from 'vscode';
import {
  adjustSelectionCore,
  expandToLinesWithoutNewlineCore,
  MinimalPosition,
  SelectionAdjusterOptions
} from './selectionAdjuster';

let isAdjusting = false;

function getOptions(): SelectionAdjusterOptions {
  const config = vscode.workspace.getConfiguration('selectLineWithoutNewline');
  return {
    enabled: config.get<boolean>('enabled', true),
    handleMultiLine: config.get<boolean>('handleMultiLine', true)
  };
}

function createSelection(anchor: MinimalPosition, active: MinimalPosition): vscode.Selection {
  return new vscode.Selection(anchor.line, anchor.character, active.line, active.character);
}

export function activate(context: vscode.ExtensionContext) {
  const selectionDisposable = vscode.window.onDidChangeTextEditorSelection((event) => {
    // 自身の補正が発火させる選択変更イベントでの再帰呼び出しを防止する。
    // 補正後の選択範囲は行選択パターンに一致しない（空行を除く）ため二重補正にもならないが、
    // 空行の補正結果（空の選択範囲）を含め、代入直後の再入をここで確実に止める。
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
      const adjusted = adjustSelectionCore(editor.document, selection, options, createSelection);
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

  // 設定をコマンドパレットから切り替える。設定ファイルを開かずに一時停止・再開できる。
  const toggleDisposable = vscode.commands.registerCommand(
    'selectLineWithoutNewline.toggleEnabled',
    async () => {
      const config = vscode.workspace.getConfiguration('selectLineWithoutNewline');
      const next = !config.get<boolean>('enabled', true);
      await config.update('enabled', next, vscode.ConfigurationTarget.Global);
      void vscode.window.showInformationMessage(
        next ? 'TriClick: automatic adjustment enabled.' : 'TriClick: automatic adjustment disabled.'
      );
    }
  );

  // キーボード用の明示的な行選択コマンド。既定のキーバインドは割り当てないので、
  // 使いたい人がキーボードショートカット設定で自由に割り当てられる。
  // マウス選択への自動補正（enabled 設定）の対象外で、呼び出したときだけ動作する。
  const selectLineDisposable = vscode.commands.registerCommand(
    'selectLineWithoutNewline.selectLine',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      editor.selections = editor.selections.map((selection) =>
        expandToLinesWithoutNewlineCore(editor.document, selection, createSelection)
      );
    }
  );

  context.subscriptions.push(selectionDisposable, toggleDisposable, selectLineDisposable);
}

export function deactivate() {}
