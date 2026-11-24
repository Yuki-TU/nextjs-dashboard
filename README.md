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

各章について、公式チュートリアルの推奨事項と、コード例を載せています。
「このリポジトリでの対応箇所」は、実際に書いたファイルです。

### 第 1 章: Getting Started

**推奨事項**

- パッケージマネージャは pnpm を推奨。
- TypeScript の型で、金額に文字列を渡すといった誤った型のデータを防ぐ。
- 規模が大きくなったら、Prisma や Drizzle でスキーマから型を自動生成することを推奨。

**コード例(公式)**

```ts
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
```

### 第 2 章: CSS Styling

**推奨事項**

- グローバル CSS は、最上位のコンポーネント(レイアウト)で import するのが一般的。
- Tailwind は、スタイルを JSX と一緒に書く。要素を消しても CSS を別に保守する必要がなく、CSS の肥大化やスタイルの衝突も起きにくい。
- CSS Modules も選択肢。好みで使い分けられる。

**このリポジトリでの対応箇所**: `app/layout.tsx` でグローバル CSS を読み込んでいます。

```tsx
// app/layout.tsx
import "@/app/ui/global.css";
import { inter } from "./ui/fonts";
```

### 第 3 章: Optimizing Fonts and Images

**推奨事項**

- フォントは、使う subset と weight を指定する。
- 画像は `next/image` で自動最適化する。
- `width` と `height` を指定してレイアウトシフトを防ぐ。値は表示サイズではなく、元画像の縦横比に合わせる。

**コード例(公式)**

```tsx
import { Inter, Lusitana } from 'next/font/google';

export const inter = Inter({ subsets: ['latin'] });

export const lusitana = Lusitana({
  subsets: ['latin'],
  weight: ['400', '700'],
});
```

**このリポジトリでの対応箇所**: `app/ui/fonts.ts`(上記と同じ形で `Inter` と `Lusitana` を定義)。

### 第 4 章: Creating Layouts and Pages

**推奨事項**

- 複数ページで共通の UI は `layout.tsx` に置く。
- ダッシュボード専用のレイアウトなら、ルートレイアウトに UI を足す必要はない。
- `nav-links.tsx` は Next.js の特殊ファイルではないので、名前は自由に付けられる。

**コード例(このリポジトリ: `app/dashboard/layout.tsx`)**

```tsx
import SideNav from "@/app/ui/dashboard/sidenav";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-64">
        <SideNav />
      </div>
      <div className="grow p-6 md:overflow-y-auto md:p-12">{children}</div>
    </div>
  );
}
```

### 第 5 章: Navigating Between Pages

**推奨事項**

- ページ遷移には `<a>` ではなく `<Link>` を使う。
- 本番では、画面内に入った `<Link>` の遷移先コードが自動でプリフェッチされる。
- 現在のパスでリンクを強調する処理は、クライアント側の `usePathname` で行う。

**コード例(このリポジトリ: `app/ui/dashboard/nav-links.tsx`)**

```tsx
"use client";

import { usePathname } from "next/navigation";
import clsx from "clsx";
import Link from "next/link";

// ...

const pathname = usePathname();

<Link
  key={link.name}
  href={link.href}
  className={clsx(
    "flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3",
    {
      "bg-sky-100 text-blue-600": pathname === link.href,
    },
  )}
>
```

### 第 6 章: Setting Up Your Database

**推奨事項**

- `.env` を `.gitignore` に入れて、DB の秘密情報を push しないようにする(公式で「重要」と明記)。
- Vercel でのデプロイを想定したリージョンは、レイテンシを下げるため `iad1`(Washington D.C.)を推奨。
- bcrypt が環境で動かない場合は `bcryptjs` に置き換えられる。
- `DROP TABLE` はサンプルアプリでのみ使い、本番では実行しない。

**このリポジトリでの対応箇所**: `.gitignore` で `.env*.local` を除外しています。`app/seed/route.ts` でパスワードを bcrypt でハッシュ化しています。

```ts
// app/seed/route.ts
const hashedPassword = await bcrypt.hash(user.password, 10);
```

### 第 7 章: Fetching Data

**推奨事項**

- クライアントから直接 DB に問い合わせず、サーバー側に API 層を置く。DB の秘密情報を守るため。
- 必要なデータだけを SQL で取得する。最新 5 件なら、メモリ上で並べ替えるのではなく SQL で絞り込む。
- 互いに依存しないデータ取得は、並列に実行してウォーターフォールを避ける(`Promise.all`)。

**コード例(このリポジトリ: `app/lib/data.ts` の `fetchCardData`)**

```ts
const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
const invoiceStatusPromise = sql`SELECT
     SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
     SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
     FROM invoices`;

const data = await Promise.all([
  invoiceCountPromise,
  customerCountPromise,
  invoiceStatusPromise,
]);
```

**最新 5 件を SQL で取得する例(同ファイル `fetchLatestInvoices`)**

```ts
const data = await sql<LatestInvoiceRaw[]>`
  SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
  FROM invoices
  JOIN customers ON invoices.customer_id = customers.id
  ORDER BY invoices.date DESC
  LIMIT 5`;
```

### 第 8 章: Static and Dynamic Rendering

**推奨事項**

- 静的レンダリングは、キャッシュ配信で速く、サーバー負荷も下がり、SEO にも有利。ただし、個人化されたデータには向かない。
- 動的レンダリングは、リアルタイムデータやユーザー固有のデータに向く。Cookie や検索パラメータなど、リクエスト時にしか分からない情報も扱える。
- ダッシュボードは個人化されるため、動的レンダリングが適している。

**コード例(公式: 人工的に遅延させる)**

```ts
export async function fetchRevenue() {
  // Artificially delay a response for demo purposes.
  // Don't do this in production :)
  await new Promise((resolve) => setTimeout(resolve, 3000));
  // ...
}
```

**このリポジトリでの対応箇所**: `app/lib/data.ts` の `fetchRevenue` と `fetchLatestInvoices` に、学習用の遅延が残っています。

### 第 9 章: Streaming

**推奨事項**

- データ取得は、そのデータを使うコンポーネントの中へ移す。そのうえでコンポーネントを `Suspense` で囲む。
- 複数のコンポーネントを同時に読み込みたいときも、同じパターンを使える。
- 公式は「Suspense を試して、どれが良いか確かめるように」と勧めている。

**コード例(公式: ページ単位のローディング)**

```tsx
// app/dashboard/(overview)/loading.tsx
import DashboardSkeleton from '@/app/ui/skeletons';

export default function Loading() {
  return <DashboardSkeleton />;
}
```

**このリポジトリでの対応箇所(`app/dashboard/(overview)/page.tsx`)**

```tsx
<Suspense fallback={<RevenueChartSkeleton />}>
  <RevenueChart />
</Suspense>
<Suspense fallback={<LatestInvoicesSkeleton />}>
  <LatestInvoices />
</Suspense>
```

### 第 10 章: Adding Search and Pagination

**推奨事項**

- 検索語やページ番号は、クライアントの state ではなく URL の search params で管理する。URL の共有・ブックマーク、サーバーでの初期描画、分析がしやすくなる。
- クライアントで読むなら `useSearchParams()` を使う。サーバーに戻らずに済む。
- キー入力のように頻繁に発生するイベントは、debounce で待つ(`use-debounce`)。
- クライアントから直接データを取らない。API 層を使わないと、DB の秘密情報が露出するため。

**コード例(このリポジトリ: `app/ui/search.tsx`、コメントを省略した抜粋)**

```tsx
const handleSearch = useDebouncedCallback((term: string) => {
  const params = new URLSearchParams(searchParams);
  params.set("page", "1");
  if (term) {
    params.set("query", term);
  } else {
    params.delete("query");
  }
  replace(`${pathname}?${params.toString()}`);
}, 300);
```

**サーバー側で読む例(`app/dashboard/invoices/page.tsx`)**

```tsx
export default async function Page(props: {
  searchParams?: Promise<{ query?: string; page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;
  // ...
}
```

### 第 11 章: Mutating Data

**推奨事項**

- Server Actions は、専用のファイル(`actions.ts`)にまとめることを推奨。
- フォームのデータは、Zod などで型を検証する。
- 金額はセント単位の整数で保存する。浮動小数点の誤差を防ぐため。
- 項目が多いフォームでは、`Object.fromEntries(formData.entries())` が便利。
- id には連番ではなく UUID を使う方法を紹介している。URL を短くしたい場合は連番も選べる。
- Server Action に id を渡すには、`bind` か hidden input を使う。

**コード例(このリポジトリ: `app/lib/actions.ts` の `createInvoice`、抜粋・一部省略)**

```ts
const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
    };
  }
  const amountInCents = validatedFields.data.amount * 100;
  // ...
}
```

**id を bind で渡す例(`app/ui/invoices/edit-form.tsx`)**

```tsx
const updateInvoiceWithId = updateInvoice.bind(null, invoice.id);

return <form action={updateInvoiceWithId}>{/* ... */}</form>;
```

### 第 12 章: Handling Errors

**推奨事項**

- `redirect` は `try/catch` の中ではなく、後ろで呼ぶ。`redirect` は内部で例外を投げるため、`catch` に捕まらないようにするため。
- DB のエラーは、`catch` で専用のメッセージを返す。

**コード例(公式: 想定外のエラーを投げる)**

```ts
export async function deleteInvoice(id: string) {
  throw new Error('Failed to Delete Invoice');

  // Unreachable code block
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
}
```

**このリポジトリでの対応箇所**: `app/lib/actions.ts` の `deleteInvoice` の先頭に、同じ `throw` が学習用に残っています。

**コード例(公式: `error.tsx`)**

```tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // ...
  return <button onClick={() => reset()}>Try again</button>;
}
```

**存在しない id の扱い(`app/dashboard/invoices/[id]/edit/page.tsx`)**

```tsx
if (!invoice) {
  notFound();
}
```

### 第 13 章: Improving Accessibility

**推奨事項**

- 入力欄には、`div` ではなくセマンティックな要素(`input`、`option` など)を使う。
- `label` と入力欄を紐付ける。
- エラーメッセージは `aria-live="polite"` で、スクリーンリーダーに伝える。
- フォームのバリデーションは、ブラウザ側(`required` など)とサーバー側(Zod)の両方で行う。
- 画像には `alt` が必要。ESLint の `jsx-a11y` が警告する。
- さらに学ぶなら、web.dev の Learn Accessibility を推奨。

**コード例(このリポジトリ: `app/ui/invoices/create-form.tsx`)**

```tsx
<select
  id="customer"
  name="customerId"
  defaultValue=""
  aria-describedby="customer-error"
>
  {/* ... */}
</select>

<div id="customer-error" aria-live="polite" aria-atomic="true">
  {state.errors?.customerId && /* エラーを表示 */ null}
</div>
```

**コード例(このリポジトリ: `app/ui/login-form.tsx`)**

```tsx
<input
  id="email"
  type="email"
  name="email"
  placeholder="Enter your email address"
  required
/>
```

### 第 14 章: Adding Authentication

**推奨事項**

- パスワードは、保存する前に必ずハッシュ化する。
- Proxy(旧 middleware)の `matcher` で、認証を適用するパスを絞る。
- 認証は複数の方法を組み合わせると安全性が上がる。2 要素認証(2FA)が例として挙げられている。

**コード例(このリポジトリ: `auth.config.ts` の `authorized`)**

```ts
authorized({ auth, request: { nextUrl } }) {
  const isLoggedIn = !!auth?.user;
  const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
  if (isOnDashboard) {
    if (isLoggedIn) return true;
    return false; // ログインしていない場合はログインページにリダイレクト
  } else if (isLoggedIn) {
    return Response.redirect(new URL("/dashboard", nextUrl));
  }
  return true;
},
```

**コード例(このリポジトリ: `auth.ts` のパスワード照合)**

```ts
const passwordsMatch = await bcrypt.compare(password, user.password);
```

**コード例(このリポジトリ: `proxy.ts` の `matcher`)**

```ts
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
```

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
