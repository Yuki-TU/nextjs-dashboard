"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { generatePagination } from "@/app/lib/utils";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * ページネーションのコンポーネント。
 * @param totalPages 総ページ数
 * @returns ページネーションのコンポーネント
 */
export default function Pagination({ totalPages }: { totalPages: number }) {
  // NOTE: Uncomment this code in Chapter 10
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  /**
   * ページURLを作成する関数
   * @param pageNumber ページ番号
   * @returns ページURL
   */
  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  // ページ番号を生成する
  // allPagesは、ページ番号の配列を生成する。
  // ex: [1, 2, 3, "...", 10]
  const allPages = generatePagination(currentPage, totalPages);

  return (
    <>
      {/*  NOTE: Uncomment this code in Chapter 10 */}

      <div className="inline-flex">
        <PaginationArrow
          direction="left"
          href={createPageURL(currentPage - 1)}
          isDisabled={currentPage <= 1}
        />

        <div className="flex -space-x-px">
          {allPages.map((page, index) => {
            let position: "first" | "last" | "single" | "middle" | undefined;
            // positionは、ページ番号の位置を決める。
            // ex: first, last, single, middle
            if (index === 0) position = "first";
            // 最後のページの場合は、lastを設定する。
            if (index === allPages.length - 1) position = "last";
            // 1ページの場合は、singleを設定する。
            if (allPages.length === 1) position = "single";
            // ページ番号が...の場合は、middleを設定する。
            // ex: [1, 2, 3, "...", 10]
            if (page === "...") position = "middle";

            // ページ番号のコンポーネントを返す。
            return (
              <PaginationNumber
                key={`${page}-${index}`}
                href={createPageURL(page)}
                page={page}
                position={position}
                isActive={currentPage === page}
              />
            );
          })}
        </div>

        <PaginationArrow
          direction="right"
          href={createPageURL(currentPage + 1)}
          isDisabled={currentPage >= totalPages}
        />
      </div>
    </>
  );
}

/**
 * ページ番号のコンポーネント。
 * @param page ページ番号
 * @param href ページURL
 * @param isActive アクティブかどうか
 * @param position 位置
 * @returns ページ番号のコンポーネント
 */
function PaginationNumber({
  page,
  href,
  isActive,
  position,
}: {
  page: number | string;
  href: string;
  position?: "first" | "last" | "middle" | "single";
  isActive: boolean;
}) {
  const className = clsx(
    "flex h-10 w-10 items-center justify-center text-sm border",
    {
      "rounded-l-md": position === "first" || position === "single",
      "rounded-r-md": position === "last" || position === "single",
      "z-10 bg-blue-600 border-blue-600 text-white": isActive,
      "hover:bg-gray-100": !isActive && position !== "middle",
      "text-gray-300": position === "middle",
    },
  );

  return isActive || position === "middle" ? (
    <div className={className}>{page}</div>
  ) : (
    <Link href={href} className={className}>
      {page}
    </Link>
  );
}

/**
 * ページネーションの矢印のコンポーネント。
 * @param href ページURL
 * @param direction 方向
 * @param isDisabled 無効かどうか
 * @returns ページネーションの矢印のコンポーネント
 */
function PaginationArrow({
  href,
  direction,
  isDisabled,
}: {
  href: string;
  direction: "left" | "right";
  isDisabled?: boolean;
}) {
  const className = clsx(
    "flex h-10 w-10 items-center justify-center rounded-md border",
    {
      "pointer-events-none text-gray-300": isDisabled,
      "hover:bg-gray-100": !isDisabled,
      "mr-2 md:mr-4": direction === "left",
      "ml-2 md:ml-4": direction === "right",
    },
  );

  const icon =
    direction === "left" ? (
      <ArrowLeftIcon className="w-4" />
    ) : (
      <ArrowRightIcon className="w-4" />
    );

  return isDisabled ? (
    <div className={className}>{icon}</div>
  ) : (
    <Link className={className} href={href}>
      {icon}
    </Link>
  );
}
