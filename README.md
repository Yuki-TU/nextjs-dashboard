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

### 第 1 章: Getting Started

- `create-next-app` でスターターテンプレートからプロジェクトを作成し、`pnpm dev` で開発サーバーを起動する。
- フォルダ構成の基本は次のとおり。
  - `/app`: ルーティングとアプリ本体
  - `/app/lib`: データ取得やユーティリティなどの関数
  - `/app/ui`: UI コンポーネント
  - `/public`: 画像などの静的ファイル
- プレースホルダーのデータ(`app/lib/placeholder-data.ts`)と型定義(`app/lib/definitions.ts`)を用意する。

### 第 2 章: CSS Styling

- グローバル CSS(`app/ui/global.css`)を、ルートレイアウト(`app/layout.tsx`)で import して全ページに適用する。
- Tailwind CSS はクラス名を直接書くユーティリティファーストの方式。
- `clsx` を使うと、条件によってクラス名を切り替えられる(例: アクティブなリンクの色)。

### 第 3 章: Optimizing Fonts and Images

- `next/font` でフォント(`Inter`、`Lusitana`)を読み込む(`app/ui/fonts.ts`)。フォントはビルド時に取得され、レイアウトシフトを防ぐ。
- `next/image` の `<Image>` コンポーネントで、画像の遅延読み込みとレイアウトシフトの防止ができる。
- デスクトップ用とモバイル用の画像を、Tailwind の `hidden md:block` などで出し分ける。

### 第 4 章: Creating Layouts and Pages

- フォルダ名がそのままルートになる。ページは `page.tsx` で定義する。
- `layout.tsx` は共通の UI で、ページ遷移しても再レンダリングされない(部分レンダリング)。
- `app/dashboard/layout.tsx` にサイドナビを置き、`/dashboard` 配下のページで共有する。
- ルートグループ `(overview)` を使うと、URL に影響を与えずにファイルを整理できる。
- `app/layout.tsx`(ルートレイアウト)は必須で、`<html>` と `<body>` を含める。

### 第 5 章: Navigating Between Pages

- `<Link>` コンポーネントでクライアントサイドのナビゲーションを行う。ページ全体を再読み込みしない。
- ビューポートに入ったリンク先のコードは、自動でプリフェッチされる。
- `usePathname()` で現在のパスを取得し、アクティブなリンクのスタイルを切り替える(`app/ui/dashboard/nav-links.tsx`)。`usePathname` を使うコンポーネントは Client Component にする。

### 第 6 章: Setting Up Your Database

- PostgreSQL に接続し、`users` / `customers` / `invoices` / `revenue` の各テーブルを作成してデータを投入する。
- 元のチュートリアルは Vercel の Postgres を使うが、このリポジトリではローカルの Docker(`docker-compose.yml`)で `postgres:17-alpine` を起動している。
- シードは Route Handler(`app/seed/route.ts`)で行う。動作確認用のクエリ用 Route Handler が `app/query/route.ts` にある。
- 接続情報は環境変数(`.env.local`)で管理する。

### 第 7 章: Fetching Data

- Server Component は `async/await` で直接 DB に問い合わせられる。API レイヤーは不要。
- SQL は `postgres` ライブラリのタグ付きテンプレートで書く。パラメータは自動でエスケープされ、SQL インジェクションを防げる。
- ダッシュボードのデータ取得関数は `app/lib/data.ts` にまとめる。
- **リクエストウォーターフォール**: 前のリクエストの完了を待って次を実行すると、全体が遅くなる。独立したクエリは `Promise.all()` で並列に実行する(`fetchCardData`)。

### 第 8 章: Static and Dynamic Rendering

- **静的レンダリング**: ビルド時(または再検証時)にレンダリングし、結果をキャッシュ・配信する。高速で CDN に載せやすい。
- **動的レンダリング**: リクエストごとにレンダリングする。ユーザー固有のデータや、リアルタイムのデータに使う。
- `fetchRevenue` に人工的な遅延(3 秒)を入れて、1 つのデータ取得が遅いとページ全体が遅くなることを確認する。

### 第 9 章: Streaming

- ストリーミングは、ページを小さなチャンクに分けて、準備できた順にクライアントへ送る技術。
- ページ単位は `loading.tsx` を置く。ルートグループ `(overview)` に置くことで、請求書ページなど他のページには適用されない。
- コンポーネント単位は `<Suspense fallback={...}>` で囲む。`CardWrapper`、`RevenueChart`、`LatestInvoices` を個別にストリーミングする(`app/dashboard/(overview)/page.tsx`)。
- `app/ui/skeletons.tsx` のスケルトンをフォールバックに使う。
- データ取得を、親ページからそれを使うコンポーネントの中へ移すと、必要な部分だけをストリーミングできる。

### 第 10 章: Adding Search and Pagination

- 検索クエリやページ番号は、状態ではなく **URL のクエリパラメータ** で持つ。ブックマーク・共有ができ、サーバー側でも使える。
- `useSearchParams` / `usePathname` / `useRouter().replace` で URL を更新する(`app/ui/search.tsx`)。
- `page.tsx` は `searchParams`(Promise)を受け取り、サーバー側でデータを絞り込む。
- `use-debounce` の `useDebouncedCallback` で入力を 300ms デバウンスし、DB へのクエリ数を減らす。
- 検索時はページを 1 に戻す。
- ページネーションは総ページ数を `fetchInvoicesPages` で取得し、`app/ui/invoices/pagination.tsx` で表示する。
- `<Suspense key={query + currentPage}>` で、検索条件が変わるたびにフォールバックを再表示する。

### 第 11 章: Mutating Data

- **Server Actions**: `"use server"` を付けた非同期関数で、サーバー上でデータを更新できる(`app/lib/actions.ts`)。
- `<form action={...}>` に渡すと、フォームデータ(`FormData`)を受け取れる。JavaScript が無効でも動作する(プログレッシブエンハンスメント)。
- 作成・更新・削除(CRUD)の流れ:
  1. `FormData` から値を取り出す。
  2. Zod で検証・型変換する(`z.coerce.number()` など)。
  3. 金額は浮動小数点の誤差を避けるため、セント単位の整数で保存する。
  4. `INSERT` / `UPDATE` / `DELETE` を実行する。
  5. `revalidatePath` でキャッシュを破棄し、`redirect` で一覧へ戻す。
- 動的ルート(`/dashboard/invoices/[id]/edit`)で、`params` から id を受け取り、編集フォームを表示する。
- `updateInvoice.bind(null, id)` で、Server Action に引数を渡す。

### 第 12 章: Handling Errors

- Server Action 内で `try/catch` を使い、DB エラーを処理する。`redirect` は `try/catch` の外で呼ぶ(内部で例外を投げて動くため)。
- `error.tsx`(Client Component)は、そのルート配下の想定外のエラーを捕捉し、`reset()` で再試行できる(`app/dashboard/invoices/error.tsx`)。
- `notFound()` を呼ぶと `not-found.tsx` を表示できる。存在しない id の編集ページなどで使う。`error.tsx` より優先される。
- 動作確認のため、`deleteInvoice` の先頭に `throw new Error(...)` が入っている(`error.tsx` の確認用)。

### 第 13 章: Improving Accessibility

- `eslint-plugin-jsx-a11y`(`eslint-config-next` に含まれる)で、アクセシビリティの問題を静的に検出する。`pnpm lint` で確認する。
- フォームのアクセシビリティ:
  - セマンティックな HTML を使う。
  - `<label>` と `htmlFor` で入力欄に紐づける。
  - フォーカスのスタイルを付ける。
- **フォームのバリデーション**:
  - クライアント側は `required` 属性を使う。
  - サーバー側は Zod の `safeParse` を使い、エラーを返す。
  - `useActionState` で `state`(`errors` / `message`)を受け取り、`aria-describedby` と `aria-live="polite"` でスクリーンリーダーにエラーを伝える(`app/ui/invoices/create-form.tsx`)。

### 第 14 章: Adding Authentication

- Auth.js(`next-auth@5`)で認証を実装する。パスワードは `bcrypt` でハッシュ化して保存する。
- `auth.config.ts`: ログインページ(`/login`)と、`authorized` コールバック(`/dashboard` 配下はログイン必須、ログイン済みなら `/dashboard` へリダイレクト)を設定する。
- `proxy.ts`(旧 middleware): `auth.config` を使い、`matcher` に合うリクエストごとに認証を確認する。認証が済むまでダッシュボードの描画を始めない。
- `auth.ts`: `Credentials` プロバイダーで、メールアドレスとパスワードを Zod で検証し、DB からユーザーを取得して `bcrypt.compare` でパスワードを照合する。
- `authenticate` Server Action(`app/lib/actions.ts`)で `signIn("credentials", formData)` を呼び、`AuthError` の種類に応じてエラーメッセージを返す。
- ログインフォーム(`app/ui/login-form.tsx`)は `useActionState` でエラー表示と送信中の状態を扱う。
- サイドナビのサインアウトボタンから `signOut` を呼び出す。

## スクリプト

| コマンド | 内容 |
| --- | --- |
| `pnpm dev` | 開発サーバー起動(Turbopack) |
| `pnpm build` | 本番ビルド |
| `pnpm start` | 本番サーバー起動 |
| `pnpm lint` | ESLint 実行 |

## 補足

- 学習用のため、動作確認用の人工的な遅延(`app/lib/data.ts`)や、エラー確認用の `throw`(`app/lib/actions.ts` の `deleteInvoice`)が残っている。
- 第 15 章(Adding Metadata)は未実施。
