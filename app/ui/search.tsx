"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

// use clientでは、Propsにおいて、動的な値を渡さないようにする。
// use clientでは、propsじゃなくて、useSearchParamsを使って、パスパラメータを取得する。
// Next.jsの状態管理、パスパラメータを通して行うことがよい。

/**
 * 検索ボックスのコンポーネント。
 * @param placeholder 検索ボックスのプレースホルダー
 * @returns 検索ボックスのコンポーネント
 */
export default function Search({ placeholder }: { placeholder: string }) {
  // useSearchParamsは、URLのパラメータを管理するためのフック。
  const searchParams = useSearchParams();
  // usePathnameは、現在のパスを管理するためのフック。
  const pathname = usePathname();
  // useRouterは、ナビゲーションを管理するためのフック。
  // replaceは、パスを更新するためのメソッド。
  const { replace } = useRouter();

  /**
   * useDebouncedCallbackは、debounceを実装するためのヘルパー関数。
   * 300msのデバウンスを実装する。
   */
  const handleSearch = useDebouncedCallback((term: string) => {
    // URLSearchParamsは、URLのパラメータを管理するためのクラス。
    // ここでは、searchParamsをnew URLSearchParamsで初期化して、paramsに代入している。
    const params = new URLSearchParams(searchParams);
    // 検索したら、ページを1に戻す。
    params.set("page", "1");
    // 検索したら、queryを更新する。
    if (term) {
      // 検索したら、queryを更新する。
      params.set("query", term);
      // 検索したら、パスを更新する。
      replace(`${pathname}?${params.toString()}`);
      return;
    }
    // 空文字を設定したら、queryを削除する。
    params.delete("query");

    // 検索したら、パスを更新する。
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get("query")?.toString()}
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}
