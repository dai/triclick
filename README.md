# TriClick

[English follows below.](#english)

VS Codeでマウスのトリプルクリックや行番号のクリックで行を選択した際に、**行末の改行コードを含めずにテキストを選択**する拡張機能です。

## 特徴

- 行末の改行コード（`\r\n` または `\n`）を選択範囲から除外し、コードやターミナルへの貼り付けに不要な末尾改行が入るのを防ぎます。
- マウスによる行選択を自動補正します。キーボードやコマンドによる選択は自動では変更しません。
- ドラッグによる複数行選択では、最終行の末尾改行だけを除外します。行と行の間の改行は保持します。
- マルチカーソル選択と、下から上への逆方向選択に対応しています。
- 自動補正全体と複数行への適用を、それぞれ設定で無効にできます。
- コマンドパレットから自動補正の有効/無効を切り替えられます。また、キーボードショートカットを割り当てて使える、明示的な「改行を含めずに行を選択」コマンドも用意しています。

## インストール

VS Code 1.90.0以降に対応しています。

[Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=dai.select-line-without-newline) で公開しています。拡張機能ビューで `dai.select-line-without-newline` を検索するか、以下を実行してインストールできます。

```bash
code --install-extension dai.select-line-without-newline
```

### VSIXファイルからインストール

1. [GitHub Releases](https://github.com/dai/triclick/releases)に公開されたVSIX、またはローカルで生成した `select-line-without-newline-0.0.3.vsix` を用意します。
2. VS Codeの拡張機能ビュー（`Ctrl+Shift+X` / `Cmd+Shift+X`）を開きます。
3. ビュー右上の `...` メニューから **「VSIX からのインストール...」** を選び、VSIXファイルを指定します。

ターミナルからインストールすることもできます。

```bash
code --install-extension select-line-without-newline-0.0.3.vsix
```

## 設定

VS Codeの設定（`Ctrl+,` / `Cmd+,`）で、以下の項目を変更できます。

| 設定項目 | 型 | 初期値 | 説明 |
| :--- | :--- | :--- | :--- |
| `selectLineWithoutNewline.enabled` | `boolean` | `true` | 行末の改行を自動除外する機能の有効・無効を切り替えます。 |
| `selectLineWithoutNewline.handleMultiLine` | `boolean` | `true` | 複数行の選択でも最終行の末尾改行を除外します。 |

## コマンド

コマンドパレット（`Ctrl+Shift+P` / `Cmd+Shift+P`）から実行できます。

| コマンド | 説明 |
| :--- | :--- |
| TriClick: 自動補正の有効/無効を切り替え | `selectLineWithoutNewline.enabled` 設定を切り替えます。 |
| TriClick: 改行を含めずに行を選択 | カーソル位置の行、または選択範囲が属する行全体を、行末の改行を含めずに選択します。自動補正とは独立した明示的なコマンドです。 |

「改行を含めずに行を選択」には既定のキーバインドはありません。キーボードショートカットの設定でコマンド `selectLineWithoutNewline.selectLine` に任意のキーを割り当ててください。

## 動作上の制限

- VS Code APIはクリック回数を通知しないため、行頭から別の行頭までのマウス選択を行選択とみなします。通常のドラッグやShift+クリックでも、この条件に合えば補正されます。
- キーボードやコマンドによる選択は自動では補正しません（上記の明示的なコマンドを除く）。
- 空行だけを選択すると、選択範囲は空になります。`editor.emptySelectionClipboard` が有効な場合、コピー操作で空行の改行が含まれることがあります。
- 複数行では、選択末尾の改行だけを除外します。行と行の間の改行は保持します。
- 対象はテキストエディターです。ターミナルやWebviewの選択は対象外です。

## 開発・ビルド

必要な環境は、Node.js 22.12以降とnpmです。これらは開発とパッケージ作成に使用します。

```bash
# 依存パッケージのインストール
npm ci

# TypeScriptのコンパイル
npm run compile

# 単体・統合テストの実行
npm test

# VS Codeを起動せずに単体テストのみ実行
npm run test:unit

# VSIXパッケージのビルド・書き出し
npm run package
```

## ライセンス

[MIT](LICENSE)

---

<a id="english"></a>

## English

A Visual Studio Code extension that **selects line text without its trailing newline** when you select lines using a mouse triple-click or a gutter (line number) click.

### Features

- Excludes trailing newline characters (`\r\n` or `\n`) from the selection, avoiding an unwanted final newline when pasting into code or a terminal.
- Automatically adjusts mouse line selections. Keyboard and command selections are not changed automatically.
- Supports multi-line drag selections, removing only the final newline and preserving internal newlines.
- Supports multiple selections and reversed selections from bottom to top.
- Provides settings to disable automatic adjustment or its application to multi-line selections.
- Provides a Command Palette toggle for automatic adjustment, and an explicit "select line without newline" command that you can bind to a keyboard shortcut.

### Installation

Requires VS Code 1.90.0 or later.

Published on the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=dai.select-line-without-newline). Search for `dai.select-line-without-newline` in the Extensions view, or run:

```bash
code --install-extension dai.select-line-without-newline
```

#### Install from a VSIX file

1. Obtain a VSIX published on [GitHub Releases](https://github.com/dai/triclick/releases), or build `select-line-without-newline-0.0.3.vsix` locally.
2. Open the Extensions view in VS Code (`Ctrl+Shift+X` / `Cmd+Shift+X`).
3. Open the `...` menu at the top of the view, select **Install from VSIX...**, and choose the VSIX file.

You can also install it from a terminal:

```bash
code --install-extension select-line-without-newline-0.0.3.vsix
```

### Configuration

Open VS Code Settings (`Ctrl+,` / `Cmd+,`) to change these options.

| Setting | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `selectLineWithoutNewline.enabled` | `boolean` | `true` | Enables or disables automatic exclusion of the trailing newline. |
| `selectLineWithoutNewline.handleMultiLine` | `boolean` | `true` | Also excludes the final newline in multi-line selections. |

### Commands

Run these from the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).

| Command | Description |
| :--- | :--- |
| TriClick: Toggle Automatic Adjustment | Toggles the `selectLineWithoutNewline.enabled` setting. |
| TriClick: Select Line(s) Without Newline | Selects the line at the cursor, or every line spanned by the selection, without the trailing newline. This is an explicit command, independent of the automatic mouse adjustment. |

The select-line command has no default keybinding. Assign any key to the command `selectLineWithoutNewline.selectLine` in the Keyboard Shortcuts settings.

### Limitations

- The VS Code API does not report click counts, so the extension recognizes mouse selections from one line start to another as line selections. Ordinary drags and Shift-clicks matching this pattern are also adjusted.
- Keyboard and command selections are not adjusted automatically (except through the explicit command above).
- Selecting only an empty line collapses the selection. With `editor.emptySelectionClipboard` enabled, copying may still include that empty line's newline.
- For multi-line selections, only the final newline is excluded. Internal newlines are preserved.
- The extension handles text editors only. Terminal and Webview selections are not supported.

### Development and build

Node.js 22.12 or later and npm are required for development and packaging.

```bash
# Install dependencies
npm ci

# Compile TypeScript
npm run compile

# Run unit and integration tests
npm test

# Run unit tests without launching VS Code
npm run test:unit

# Build and write the VSIX package
npm run package
```

### License

[MIT](LICENSE)
