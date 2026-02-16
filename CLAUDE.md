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
- GitHub Actions（毎日自動クイズ生成）

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
├── admin.html              # 管理者ダッシュボード（活動管理+クイズ管理）
├── japanese-test.html      # 日本語テストページ
├── japan-quiz.html         # 日本ローカルネタクイズ
├── CLAUDE.md               # プロジェクト仕様書（本ファイル）
├── css/
│   └── style.css           # 和風メインスタイル
├── js/
│   ├── main.js             # ナビゲーション、スクロールアニメーション
│   ├── i18n.js             # 三語翻訳データ（EN/JA/ZH）と切替ロジック
│   ├── firebase-config.js  # Firebase初期化（プレースホルダー設定）
│   ├── voting.js           # 投票システム（メンバー向け）
│   └── japan-quiz-data.js  # 旧クイズデータ（非推奨、JSONに移行済）
├── data/
│   └── quiz-questions.json # クイズ問題データ（JSON形式、一意IDあり）
├── scripts/
│   └── generate-quiz.js    # 毎日自動クイズ生成スクリプト
├── .github/
│   └── workflows/
│       └── daily-quiz.yml  # GitHub Actions 毎日クイズ自動生成ワークフロー
└── images/                 # 画像フォルダ（予約）
```

## Pages & Features

### 1. index.html — メインページ
**セクション構成:**
- Navigation（ナビバー + 言語切替 EN/日本語/中文）
- Hero（ウェルカムバナー + クイズリンクボタン）
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
- 自己完結型（CSS/JS全てインライン）

**ダッシュボードパネル:**
1. **Overview** — 統計表示（活動数、投票オープン数、クイズ問題数）
2. **Activities** — 活動CRUD（作成・ステータス切替・削除）
3. **Quiz Manager** — クイズ問題管理（詳細は下記）
4. **Settings** — Firebase接続状況、データエクスポート/クリア

**Quiz Manager (クイズ管理):**
- クイズ問題の一覧表示（カテゴリ/レベルフィルター + キーワード検索）
- 問題の追加・編集・削除（モーダルフォーム、4言語入力対応）
- データサイズ表示（プログレスバー付き、50MB上限）
- 50MB超過時に警告表示（カードが赤くハイライト）
- JSONエクスポート機能（ダウンロード → リポジトリにコミットで反映）
- 編集データはlocalStorage (`jcc-quiz-data`) に保存
- japan-quiz.html はlocalStorageを優先的に読むため、管理画面の編集が即反映

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
- index.html のヒーローセクションからリンク

**データソース:**
- `data/quiz-questions.json` から fetch で読み込み
- localStorage (`jcc-quiz-data`) にデータがあればそちらを優先（管理画面の編集反映）
- 各問題に一意ID（例: `current_beginner_000`）

**セッション追跡:**
- sessionStorage (`quizSeenIds`) で出題済みの問題IDを記録
- 同一セッション内では未出題の問題を優先的に出題
- 未出題が10問未満になった場合、出題済みの問題も混ぜてランダム出題
- 問題回答時に `markSeen(id)` でIDを記録

## Quiz Data Format (`data/quiz-questions.json`)
```json
{
  "_meta": {
    "version": 1,
    "lastUpdated": "2026-02-14",
    "totalQuestions": 69
  },
  "current": {
    "beginner": [
      {
        "id": "current_beginner_000",
        "q": { "en": "...", "zh": "...", "ja": "...", "es": "..." },
        "c": [
          { "en": "...", "zh": "...", "ja": "...", "es": "..." },
          ...
        ],
        "a": 1,
        "trivia": { "en": "...", "zh": "...", "ja": "...", "es": "..." }
      }
    ],
    "intermediate": [...],
    "advanced": [...]
  },
  "tourism": { ... },
  "history": { ... },
  "entertainment": { ... },
  "manga": { ... },
  "food": { ... }
}
```
- **カテゴリ**: current / tourism / history / entertainment / manga / food
- **レベル**: beginner / intermediate / advanced
- **IDパターン**: `{category}_{level}_{index or hash}`
- **50MBデータサイズ上限** — 超過時は管理画面で警告、生成スクリプトは書込み拒否

## Daily Quiz Auto-Generation

### GitHub Actions Workflow (`.github/workflows/daily-quiz.yml`)
- **スケジュール**: 毎日 06:00 UTC (15:00 JST)
- **手動実行**: workflow_dispatch で任意タイミング実行も可能
- `scripts/generate-quiz.js` を実行 → 変更があれば自動コミット&プッシュ

### 生成スクリプト (`scripts/generate-quiz.js`)
- キュレーション済みトピックプール（各カテゴリ/レベルに複数問題テンプレート）
- 毎回1〜3問をランダムに選択して追加
- 既存問題とのID重複チェック（英語問題文のハッシュで一意ID生成）
- 全プール問題が追加済みの場合は "No new questions to add" で終了
- 50MB超過チェック — 超過時は書き込み拒否して exit code 1
- コミットメッセージ: `Auto-generate daily quiz questions YYYY-MM-DD`

**プール拡張方法:**
`scripts/generate-quiz.js` の `TOPIC_POOLS` オブジェクトに新しい問題を追加するだけ。
形式は `data/quiz-questions.json` と同じ（`id` フィールド不要、自動生成される）。

## Visual Design — 黒白可愛い簡筆画風
| 用途 | 色 | 値 |
|------|------|------|
| 主色 | 炭墨 | `#333333` |
| 補色 | 中灰 | `#555555` |
| アクセント | 浅灰 | `#999999` |
| 背景 | 純白 | `#FFFFFF` |
| カードBG | 薄灰 | `#FAFAFA` |
| ナビ/フッター | 純黒 | `#222222` |
| テキスト | 墨黒 | `#222222` |

装飾: ドット背景パターン、虚線+✿ディバイダー、太枠線カード(2.5px)、フラット影(4px 4px 0px #333)、丸角16px、薬丸ボタン(border-radius:30px)、Patrick Hand手書きフォント、猫デコレーション

## Firebase Setup
Firebase Realtime Database は未設定。使用する場合:
1. https://console.firebase.google.com でプロジェクト作成
2. `js/firebase-config.js` にconfig値を入力
3. 未設定時は自動でlocalStorageフォールバック

## localStorage / sessionStorage Keys
| キー | 用途 | ストレージ |
|------|------|------|
| `jcc-activities` | 活動データ | localStorage |
| `jcc-quiz-data` | クイズ問題（管理画面の編集） | localStorage |
| `jcc-admin-session` | 管理者セッション | sessionStorage |
| `quizSeenIds` | クイズ出題済みID配列 | sessionStorage |
| `jcc-lang` | 言語設定 | localStorage |

## Known Issues / Notes
- GitHub PagesのCDNキャッシュは最大10分。JSファイル更新時は `?v=N` パラメータを上げること
- `gh` CLIのパスは `"/c/Program Files/GitHub CLI/gh.exe"`
- i18n.js / generate-quiz.js で文字列内に `"` を含む場合は外側を `'` にすること（SyntaxError回避）
- `ad_status.js` のERR_CONNECTION_RESETエラーはYouTube iframeの広告関連で無害
- `js/japan-quiz-data.js` は旧形式。現在は `data/quiz-questions.json` を使用（削除可能）
- クイズ管理画面の編集はlocalStorageに保存される。他のユーザーに反映するにはJSONをエクスポート→リポジトリにコミットが必要
- GitHub Actions の daily-quiz ワークフローが動作するには、リポジトリの Settings > Actions > General で "Read and write permissions" を有効にする必要がある場合がある
