# Select Line Without Newline

A Visual Studio Code extension that automatically excludes trailing newline characters (`\r\n` or `\n`) when selecting lines via mouse triple-click or gutter (line number) click.

VS Codeでマウスのトリプルクリック（または行番号のクリック）で行を選択した際に、**行末の改行コードを含めずにテキストのみを選択**する拡張機能です。

---

## 💡 特徴 / Features

- **不要な改行コードの混入を防止**:
  行全体をトリプルクリックしてコピーし、別のコード行の途中やターミナルへインラインで貼り付ける際、不要な改行が入ってしまうストレスを解消します。
- **直感的な操作感**:
  マウス操作による行選択イベントを検知し、行頭から次行先頭への選択範囲を即座に行末文字手前まで自動補正します。
- **複数行選択（ドラッグ）対応**:
  トリプルクリック後に下へドラッグして複数行を選択した場合でも、最終行の末尾改行を除外します（設定でオフにすることも可能）。
- **マルチカーソル・逆方向選択に対応**:
  複数行のマルチカーソル選択や、下から上への逆方向選択にも対応しています。

---

## ⚙️ 設定 / Configuration

VS Codeの設定（`Ctrl+,` または `Cmd+,`）から以下の項目をカスタマイズできます。

| 設定項目 | 型 | デフォルト値 | 説明 |
| :--- | :--- | :--- | :--- |
| `selectLineWithoutNewline.enabled` | `boolean` | `true` | 拡張機能による改行自動除外機能の有効 / 無効を切り替えます。 |
| `selectLineWithoutNewline.handleMultiLine` | `boolean` | `true` | トリプルクリック後のドラッグによる複数行選択時にも、最終行の改行を除外するかどうかを設定します。 |

---

## 📦 インストール方法 / Installation

### `.vsix` ファイルからインストールする場合
1. 生成された `.vsix` ファイル（例: `select-line-without-newline-0.0.1.vsix`）を用意します。
2. VS Codeの拡張機能ビュー（`Ctrl+Shift+X` / `Cmd+Shift+X`）を開きます。
3. ビュー右上の `...`（その他の操作）メニューから **「VSIX からのインストール... (Install from VSIX...)」** を選択し、`.vsix` ファイルを選択します。
   - または、ターミナルで以下のコマンドを実行します：
     ```bash
     code --install-extension select-line-without-newline-0.0.1.vsix
     ```

---

## 🛠️ 開発・ビルド / Development & Build

### 必要要件
- Node.js 20+
- npm

### スクリプト一覧
```bash
# 依存パッケージのインストール
npm install

# TypeScript コンパイル
npm run compile

# 単体・統合テストの実行
npm test

# VSIX パッケージのビルド・書き出し
npm run package
```

---

## 📄 License
MIT
