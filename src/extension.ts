import * as vscode from 'vscode';
import {
  adjustSelectionCore,
  expandToLinesWithoutNewlineCore,
  MinimalPosition,
  SelectionAdjusterOptions
} from './selectionAdjuster';

const CONFIG_SECTION = 'selectLineWithoutNewline';
const TOGGLE_COMMAND = 'selectLineWithoutNewline.toggleEnabled';
const SELECT_LINE_COMMAND = 'selectLineWithoutNewline.selectLine';

let isAdjusting = false;

function getOptions(): SelectionAdjusterOptions {
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
  return {
    enabled: config.get<boolean>('enabled', true),
    handleMultiLine: config.get<boolean>('handleMultiLine', true)
  };
}

function createSelection(anchor: MinimalPosition, active: MinimalPosition): vscode.Selection {
  return new vscode.Selection(anchor.line, anchor.character, active.line, active.character);
}

/**
 * `enabled` が実際に定義されているスコープを返す。
 *
 * 常に Global へ書き込むと、ワークスペース設定が Global を上書きしている場合に
 * 「切り替えたのに効かない」状態になる。ユーザーが最後に設定したスコープへ書き込む。
 */
function getEnabledSettingTarget(): vscode.ConfigurationTarget {
  const inspected = vscode.workspace.getConfiguration(CONFIG_SECTION).inspect<boolean>('enabled');

  if (inspected?.workspaceFolderValue !== undefined) {
    return vscode.ConfigurationTarget.WorkspaceFolder;
  }
  if (inspected?.workspaceValue !== undefined) {
    return vscode.ConfigurationTarget.Workspace;
  }
  return vscode.ConfigurationTarget.Global;
}

/**
 * ステータスバーの表示を現在の設定に合わせて更新する。
 * クリックでトグルできるため、切り替え結果のフィードバックも兼ねる。
 */
function updateStatusBarItem(item: vscode.StatusBarItem): void {
  const { enabled, handleMultiLine } = getOptions();

  if (!enabled) {
    item.text = '$(circle-slash) TriClick';
    item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    item.tooltip = vscode.l10n.t('TriClick automatic adjustment is off. Click to enable.');
    return;
  }

  item.text = '$(check) TriClick';
  item.backgroundColor = undefined;
  item.tooltip = handleMultiLine
    ? vscode.l10n.t(
        'TriClick is enabled: mouse line selections exclude the trailing newline, including multi-line selections. Click to disable.'
      )
    : vscode.l10n.t(
        'TriClick is enabled: mouse line selections exclude the trailing newline. Multi-line selections are left unchanged. Click to disable.'
      );
}

export function activate(context: vscode.ExtensionContext) {
  // 現在の有効/無効を常に確認できるようにする。クリックで切り替えられる。
  // トースト通知の代わりにこれを見せることで、切り替えのたびに通知が出ない。
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = TOGGLE_COMMAND;
  updateStatusBarItem(statusBarItem);
  statusBarItem.show();

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

  // 設定をコマンドパレットとステータスバーから切り替える。設定ファイルを開かずに一時停止・再開できる。
  const toggleDisposable = vscode.commands.registerCommand(TOGGLE_COMMAND, async () => {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const next = !config.get<boolean>('enabled', true);
    await config.update('enabled', next, getEnabledSettingTarget());
    // 設定変更イベントを待たずに表示を更新し、クリック直後の反応を返す。
    updateStatusBarItem(statusBarItem);
  });

  // キーボード用の明示的な行選択コマンド。既定のキーバインドは割り当てないので、
  // 使いたい人がキーボードショートカット設定で自由に割り当てられる。
  // マウス選択への自動補正（enabled 設定）の対象外で、呼び出したときだけ動作する。
  const selectLineDisposable = vscode.commands.registerCommand(SELECT_LINE_COMMAND, () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    editor.selections = editor.selections.map((selection) =>
      expandToLinesWithoutNewlineCore(editor.document, selection, createSelection)
    );
  });

  // 設定ファイルを直接編集した場合も、ステータスバーの表示を追従させる。
  const configurationDisposable = vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration(CONFIG_SECTION)) {
      updateStatusBarItem(statusBarItem);
    }
  });

  context.subscriptions.push(
    selectionDisposable,
    toggleDisposable,
    selectLineDisposable,
    statusBarItem,
    configurationDisposable
  );
}

export function deactivate() {}
