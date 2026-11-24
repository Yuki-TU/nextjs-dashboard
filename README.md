# Next.js Dashboard (Next.js Learn 学習用リポジトリ)

[Next.js Learn - Dashboard App](https://nextjs.org/learn/dashboard-app) のチュートリアル(第 1〜14 章)を実施したコードです。
請求書(Invoices)・顧客(Customers)を管理するダッシュボードアプリを、App Router で作成します。

## 技術スタック

- Next.js (App Router) / React / TypeScript
- Tailwind CSS(+ `@tailwindcss/forms`)
- PostgreSQL(`postgres` ライブラリ)。ローカルでは Docker で起動
- Auth.js(`next-auth@5` beta)による認証(Credentials)
- Zod(バリデーション)、`use-debounce`、`bcrypt`
- パッケージマネージャ: pnpm

## セットアップ

```bash
# 1. 依存関係のインストール
pnpm install

# 2. 環境変数の設定(.env.example をコピーして値を埋める)
cp .env.example .env.local

# 3. ローカルの PostgreSQL を起動(docker-compose.yml)
docker compose up -d

# 4. 開発サーバーの起動
pnpm dev
```

- DB の初期データ投入は `http://localhost:3000/seed` にアクセスして行います(`app/seed/route.ts`)。
- 接続先がローカル(`localhost` / `127.0.0.1`)の場合は SSL を無効にし、それ以外は SSL 必須にしています。
- `.env.local` には `POSTGRES_URL` や `AUTH_SECRET`(`openssl rand -base64 32` で生成)を設定します。`.env.local` は Git 管理外です。

## 章ごとの要点

公式チュートリアルの各章に書かれている推奨事項・注意点をまとめています。

### 第 1 章: Getting Started

- パッケージマネージャは pnpm を推奨。
- TypeScript の型で、金額に文字列を渡すといった誤った型のデータを防ぐ。
- 規模が大きくなったら、Prisma や Drizzle でスキーマから型を自動生成することを推奨。

### 第 2 章: CSS Styling

- グローバル CSS は、最上位のコンポーネント(レイアウト)で import するのが一般的。
- Tailwind は、スタイルを JSX と一緒に書く。要素を消しても CSS を別に保守する必要がなく、CSS の肥大化やスタイルの衝突も起きにくい。
- CSS Modules も選択肢。好みで使い分けられる。

### 第 3 章: Optimizing Fonts and Images

- フォントは、使う subset と weight を指定する。
- 画像は `next/image` で自動最適化する。
- `width` と `height` を指定してレイアウトシフトを防ぐ。値は表示サイズではなく、元画像の縦横比に合わせる。

### 第 4 章: Creating Layouts and Pages

- 複数ページで共通の UI は `layout.tsx` に置く。
- ダッシュボード専用のレイアウトなら、ルートレイアウトに UI を足す必要はない。
- `nav-links.tsx` は Next.js の特殊ファイルではないので、名前は自由に付けられる。

### 第 5 章: Navigating Between Pages

- ページ遷移には `<a>` ではなく `<Link>` を使う。
- 本番では、画面内に入った `<Link>` の遷移先コードが自動でプリフェッチされる。
- 現在のパスでリンクを強調する処理は、クライアント側の `usePathname` で行う。

### 第 6 章: Setting Up Your Database

- `.env` を `.gitignore` に入れて、DB の秘密情報を push しないようにする(公式で「重要」と明記)。
- Vercel でのデプロイを想定したリージョンは、レイテンシを下げるため `iad1`(Washington D.C.)を推奨。
- bcrypt が環境で動かない場合は `bcryptjs` に置き換えられる。
- `DROP TABLE` はサンプルアプリでのみ使い、本番では実行しない。

### 第 7 章: Fetching Data

- クライアントから直接 DB に問い合わせず、サーバー側に API 層を置く。DB の秘密情報を守るため。
- 必要なデータだけを SQL で取得する。最新 5 件なら、メモリ上で並べ替えるのではなく SQL で絞り込む。
- 互いに依存しないデータ取得は、並列に実行してウォーターフォールを避ける(`Promise.all`)。

### 第 8 章: Static and Dynamic Rendering

- 静的レンダリングは、キャッシュ配信で速く、サーバー負荷も下がり、SEO にも有利。ただし、個人化されたデータには向かない。
- 動的レンダリングは、リアルタイムデータやユーザー固有のデータに向く。Cookie や検索パラメータなど、リクエスト時にしか分からない情報も扱える。
- ダッシュボードは個人化されるため、動的レンダリングが適している。

### 第 9 章: Streaming

- データ取得は、そのデータを使うコンポーネントの中へ移す。そのうえでコンポーネントを `Suspense` で囲む。
- 複数のコンポーネントを同時に読み込みたいときも、同じパターンを使える。
- 公式は「Suspense を試して、どれが良いか確かめるように」と勧めている。

### 第 10 章: Adding Search and Pagination

- 検索語やページ番号は、クライアントの state ではなく URL の search params で管理する。URL の共有・ブックマーク、サーバーでの初期描画、分析がしやすくなる。
- クライアントで読むなら `useSearchParams()` を使う。サーバーに戻らずに済む。
- キー入力のように頻繁に発生するイベントは、debounce で待つ(`use-debounce`)。
- クライアントから直接データを取らない。API 層を使わないと、DB の秘密情報が露出するため。

### 第 11 章: Mutating Data

- Server Actions は、専用のファイル(`actions.ts`)にまとめることを推奨。
- フォームのデータは、Zod などで型を検証する。
- 金額はセント単位の整数で保存する。浮動小数点の誤差を防ぐため。
- 項目が多いフォームでは、`Object.fromEntries(formData.entries())` が便利。
- id には連番ではなく UUID を使う方法を紹介している。URL を短くしたい場合は連番も選べる。
- Server Action に id を渡すには、`bind` か hidden input を使う。

### 第 12 章: Error Handling

- `redirect` は `try/catch` の中ではなく、後ろで呼ぶ。`redirect` は内部で例外を投げるため、`catch` に捕まらないようにするため。
- DB のエラーは、`catch` で専用のメッセージを返す。

### 第 13 章: Improving Accessibility

- 入力欄には、`div` ではなくセマンティックな要素(`input`、`option` など)を使う。
- `label` と入力欄を紐付ける。
- エラーメッセージは `aria-live="polite"` で、スクリーンリーダーに伝える。
- フォームのバリデーションは、ブラウザ側(`required` など)とサーバー側(Zod)の両方で行う。
- 画像には `alt` が必要。ESLint の `jsx-a11y` が警告する。
- さらに学ぶなら、web.dev の Learn Accessibility を推奨。

### 第 14 章: Adding Authentication

- パスワードは、保存する前に必ずハッシュ化する。
- Proxy(旧 middleware)の `matcher` で、認証を適用するパスを絞る。
- 認証は複数の方法を組み合わせると安全性が上がる。2 要素認証(2FA)が例として挙げられている。

## スクリプト

| コマンド | 内容 |
| --- | --- |
| `pnpm dev` | 開発サーバー起動(Turbopack) |
| `pnpm build` | 本番ビルド |
| `pnpm start` | 本番サーバー起動 |
| `pnpm lint` | ESLint 実行 |

## 補足

- 学習用のため、動作確認用の人工的な遅延(`app/lib/data.ts` の `fetchRevenue` と `fetchLatestInvoices`)や、エラー確認用の `throw`(`app/lib/actions.ts` の `deleteInvoice`)が残っている。
- 第 15 章(Adding Metadata)は未実施。
