# Yuki - The Webb Schools Japanese Culture Club Website

## Project Overview
The Webb Schools Japanese Culture Club (ウェッブ日本文化部) のウェブサイト。
- **President**: Yuki Suto (須藤優輝)
- **School**: The Webb Schools
- **Purpose**: 日本文化社団の紹介・活動管理・日本語学習・日本知識クイズ

## Tech Stack
- 純粋な HTML / CSS / JavaScript（フレームワーク不使用）
- SPA風のセクション切替（単一ページ + 別ページ）
- Firebase Realtime Database（活動投票システム、未設定時はlocalStorageフォールバック）
- Google Fonts: Noto Serif / Noto Serif JP / Noto Serif SC
- Browser Speech Synthesis API（リスニングテストの音声読み上げ）

## Hosting
- **GitHub Pages**: https://abicdaigo.github.io/yuki/
- **Repository**: https://github.com/abicdaigo/yuki
- **Branch**: master
- **GitHub User**: abicdaigo（Google認証）
- **GitHub CLI**: `"/c/Program Files/GitHub CLI/gh.exe"` （パスに注意）

### Deploy方法
```bash
cd /c/Users/daigo/source/yuki
git add <files> && git commit -m "message" && git push
# GitHub Pagesが自動でmasterブランチからデプロイ
# Cache-Control: max-age=600（10分キャッシュ）
# JS/CSSファイルのキャッシュバスティングには ?v=N パラメータを使用
```

## File Structure
```
yuki/
├── index.html              # メインページ（全セクション含む）
├── admin.html              # 管理者ダッシュボード
├── japanese-test.html      # 日本語テストページ
├── japan-quiz.html          # 日本ローカルネタクイズ
├── css/
│   └── style.css           # 和風メインスタイル
├── js/
│   ├── main.js             # ナビゲーション、スクロールアニメーション
│   ├── i18n.js             # 三語翻訳データ（EN/JA/ZH）と切替ロジック
│   ├── firebase-config.js  # Firebase初期化（プレースホルダー設定）
│   ├── voting.js           # 投票システム（メンバー向け）
│   └── japan-quiz-data.js  # 日本知識クイズの問題データ
└── images/                 # 画像フォルダ（予約）
```

## Pages & Features

### 1. index.html — メインページ
**セクション構成:**
- Navigation（ナビバー + 言語切替 EN/日本語/中文）
- Hero（ウェルカムバナー）
- About（社団紹介・団長紹介）
- Festivals（日本の節日10種 × YouTube iframe埋込）
- Monthly Activities Voting（Firebase投票システム）
- Anime（アニメ紹介 + YouTube iframe）
- J-Pop（J-Pop紹介 + YouTube iframe）
- Japanese（日本語学習 + テストページリンク + YouTube iframe）
- Travel（旅行 + YouTube iframe）
- Footer

**YouTube動画:**
- `<iframe src="https://www.youtube.com/embed/VIDEO_ID">` で直接埋込
- `<img>` サムネイル方式は表示問題があったため廃止

**三語切替 (i18n):**
- `data-i18n="key"` 属性でHTML要素にキーを設定
- `js/i18n.js` に EN/JA/ZH の翻訳データ
- デフォルト言語: 英語
- localStorage に言語設定を保存

**注意: i18n.js の文字列内にダブルクォートを含む場合、外側をシングルクォートにすること**

### 2. admin.html — 管理者ページ
- **ログイン**: Username = `yuki`, Password = `yuki0801`
- sessionStorageでセッション管理
- ダッシュボード: Overview / Activities管理 / Settings
- Activities CRUD（作成・編集・削除）
- データエクスポート（JSON）/ クリア機能
- 自己完結型（CSS/JS全てインライン）

### 3. japanese-test.html — 日本語テストページ
- **レベル**: 初級 / 中級 / 上級
- **テストタイプ**: ライティング（読解・語彙）/ リスニング（音声合成）
- **4言語UI**: EN / 中文 / 日本語 / Español
- 全問題文・全選択肢が4言語対応
- リスニング: ブラウザ SpeechSynthesis API (ja-JP) で読み上げ
- 10問ランダム出題 / スコア結果表示
- index.html の日本語セクションからリンク

### 4. japan-quiz.html — 日本ローカルネタクイズ
- **カテゴリ6種**: 時事ネタ / 観光 / 歴史 / エンタメ / 漫画・アニメ / 食べ物
- **レベル**: 初級 / 中級 / 上級
- **4言語UI**: EN / 中文 / 日本語 / Español
- 全問題・選択肢が4言語対応
- 各問題に「豆知識 (trivia)」付き — 回答後に表示される教育的解説
- 問題データは `js/japan-quiz-data.js` に分離
- index.html のヒーローセクションからリンク

## Visual Design — 和風テーマ
| 用途 | 色 | 値 |
|------|------|------|
| 主色 | 朱紅（鳥居） | `#C41E3A` |
| 補色 | 藍色 | `#264653` |
| アクセント | 金色 | `#D4A843` |
| 背景 | 和紙 | `#F5F0E8` |
| テキスト | 墨黒 | `#2C2C2C` |

装飾: 麻の葉パターン、波紋ディバイダー、和紙テクスチャカード

## Firebase Setup
Firebase Realtime Database は未設定。使用する場合:
1. https://console.firebase.google.com でプロジェクト作成
2. `js/firebase-config.js` にconfig値を入力
3. 未設定時は自動でlocalStorageフォールバック

## Known Issues / Notes
- GitHub PagesのCDNキャッシュは最大10分。JSファイル更新時は `?v=N` パラメータを上げること
- `gh` CLIのパスは `"/c/Program Files/GitHub CLI/gh.exe"`
- i18n.jsで文字列内に `"` を含む場合は外側を `'` にすること（SyntaxError回避）
- `ad_status.js` のERR_CONNECTION_RESETエラーはYouTube iframeの広告関連で無害
