# Render.com デプロイ手順

## 1. Render.comのアカウント作成・ログイン

1. https://render.com にアクセス
2. 「Get Started for Free」をクリックしてアカウントを作成
3. GitHubアカウントでログインすることを推奨

## 2. Webサービスを作成

1. Render.comのダッシュボードで「New +」→「Web Service」をクリック
2. 「Connect account」でGitHubアカウントを接続（まだの場合）
3. GitHubリポジトリを選択
4. 以下の設定を入力：

### 基本設定

- **Name**: `turf-disease-forecast` または任意の名前
- **Region**: `Singapore` または `Oregon`（日本に近い地域を推奨）
- **Branch**: `main`（またはデフォルトブランチ）
- **Root Directory**: （空白のまま）

### ビルド・起動コマンド

- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 環境変数

以下の環境変数を追加：

| Key | Value | 説明 |
|-----|-------|------|
| `NODE_ENV` | `production` | 本番環境設定 |
| `MET_NORWAY_USER_AGENT` | （省略可） | 未設定なら `lib/met-norway-api.js` のデフォルト（アプリ名 + 連絡用メール）が使われます。`example.com` などのプレースホルダだけの連絡先は 403 になりやすいので入れないでください。上書きする場合は実在するメールか運用中の URL を含めてください。 |

### その他の設定

- **Auto-Deploy**: `Yes`（GitHubにプッシュされたら自動デプロイ）
- **Plan**: `Free`（無料プラン）

## 3. デプロイの実行

1. 「Create Web Service」をクリック
2. ビルドが開始されます（5-10分程度かかります）
3. ビルドが完了すると、アプリが自動的に起動します

## 4. アクセスURLの確認

- デプロイが完了すると、`https://your-app-name.onrender.com` のようなURLが発行されます
- このURLでアプリにアクセスできます

## 5. トラブルシューティング

### ビルドエラーの場合

1. Render.comのダッシュボードで「Logs」タブを確認
2. エラーメッセージを確認して修正
3. よくある原因：
   - 依存パッケージのインストールエラー
   - 環境変数の設定漏れ
   - ビルドコマンドの誤り

### アプリが起動しない場合

1. 「Events」タブで起動イベントを確認
2. 「Logs」タブでエラーログを確認
3. `npm start`コマンドが正しく動作するかローカルで確認

### 環境変数の設定漏れ

- `MET_NORWAY_USER_AGENT` が未設定の場合はコード内のデフォルト（識別子 + 連絡用メール）が使われます。独自の User-Agent に変える場合のみ Render の Environment に追加してください

## 6. カスタムドメインの設定（オプション）

1. Render.comのダッシュボードで「Settings」→「Custom Domains」
2. ドメインを追加してDNS設定を行う

## 注意事項

- 無料プランでは、一定時間アクセスがないとアプリがスリープ状態になります
- 初回起動時に時間がかかる場合があります
- メモリやCPUの制限があるため、パフォーマンスに注意してください
