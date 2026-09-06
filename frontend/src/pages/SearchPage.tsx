import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { SearchX } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { EmptyState, Skeleton } from "../components/ui";
import { listProducts } from "../lib/api";
import { cn } from "../utils/ui";

const SORTS = [
  { value: "newest", label: "Mới nhất" },
  { value: "price_asc", label: "Giá thấp đến cao" },
  { value: "price_desc", label: "Giá cao đến thấp" },
  { value: "best_seller", label: "Bán chạy" },
];

// LỰA CHỌN toolbar:
// - Chủng loại (theme, tập mở, không đếm trước được) dùng pill scroll-snap ngang thay vì
//   <ul> liệt kê: đúng §4.9 (list mở > 5 mục phải có UI riêng, không dùng divide-y mặc định).
//   Pill là ngoại lệ rounded-full duy nhất theo Shape Lock.
// - Sắp xếp giữ <select> native: đây là form control chuẩn (a11y, autofill, mobile picker),
//   không thay bằng dropdown custom chỉ vì "đẹp".
// - Khoảng giá dùng 2 ô số + nút Áp dụng (API đã hỗ trợ min_price/max_price nhưng UI chưa
//   từng expose): đơn giản hơn slider custom, ít state hơn, dễ kiểm chứng.
// - Loading dùng Skeleton đúng hình tile cuối (§4.5) thay vì spinner tròn generic.
// - Phân trang giữ nút số (tổng trang hữu hạn, thân thiện back-button) thay vì infinite
//   scroll (cần virtualizer, phá nút Quay lại).
export default function SearchPage() {
  const [sp] = useSearchParams();
  const [sort, setSort] = useState("newest");
  const q = sp.get("q") ?? "";
  const theme = sp.get("theme") ?? "";
  const workshopId = sp.get("workshop_id") ?? "";
  const [page, setPage] = useState(1);
  const [minDraft, setMinDraft] = useState("");
  const [maxDraft, setMaxDraft] = useState("");
  const [price, setPrice] = useState<{ min?: number; max?: number }>({});

  useEffect(() => {
    setPage(1);
  }, [q, theme, workshopId]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", "search", q, theme, workshopId, sort, page, price.min, price.max],
    queryFn: () =>
      listProducts({
        q: q || undefined,
        theme: theme || undefined,
        workshop_id: workshopId || undefined,
        sort: sort as never,
        page,
        page_size: 9,
        min_price: price.min,
        max_price: price.max,
      }),
  });

  const totalPages = Math.max(1, data?.total_pages ?? 1);
  const goTo = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0 });
  };

  const themes = useMemo(() => {
    const all = data?.items.map((p) => p.theme).filter(Boolean) as string[];
    return Array.from(new Set(all));
  }, [data]);

  const applyPrice = () => {
    const min = minDraft ? Number(minDraft) : undefined;
    const max = maxDraft ? Number(maxDraft) : undefined;
    setPrice({
      min: min != null && Number.isFinite(min) ? min : undefined,
      max: max != null && Number.isFinite(max) ? max : undefined,
    });
    goTo(1);
  };

  const clearFilters = () => {
    setSort("newest");
    setMinDraft("");
    setMaxDraft("");
    setPrice({});
    goTo(1);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ceramic-900">
        Khám phá{q ? `: “${q}”` : ""}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          Sắp xếp
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              goTo(1);
            }}
            className="rounded-md border border-cream-200 bg-white px-3 py-1.5 text-sm text-ink focus:border-dat-600 focus:outline-none focus:ring-2 focus:ring-dat-200"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-2 text-sm text-ink-soft">
          <span>Giá</span>
          <input
            value={minDraft}
            onChange={(e) => setMinDraft(e.target.value)}
            inputMode="numeric"
            placeholder="Từ"
            aria-label="Giá thấp nhất"
            className="w-28 rounded-md border border-cream-200 bg-white px-3 py-1.5 text-sm text-ink placeholder:text-ink-faint focus:border-dat-600 focus:outline-none focus:ring-2 focus:ring-dat-200"
          />
          <span aria-hidden>-</span>
          <input
            value={maxDraft}
            onChange={(e) => setMaxDraft(e.target.value)}
            inputMode="numeric"
            placeholder="Đến"
            aria-label="Giá cao nhất"
            className="w-28 rounded-md border border-cream-200 bg-white px-3 py-1.5 text-sm text-ink placeholder:text-ink-faint focus:border-dat-600 focus:outline-none focus:ring-2 focus:ring-dat-200"
          />
          <button
            onClick={applyPrice}
            className="rounded-md border border-cream-200 bg-white px-3 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-cream-50 active:translate-y-px"
          >
            Áp dụng
          </button>
        </div>
        {data && data.total > 9 && (
          <p className="text-xs text-ink-faint">
            {(data?.total ?? 0).toLocaleString("vi-VN")} sản phẩm
          </p>
        )}
      </div>

      {themes.length > 0 && (
        <div
          className="mt-3 flex snap-x gap-1.5 overflow-x-auto pb-1"
          role="group"
          aria-label="Lọc theo dòng sản phẩm"
        >
          {themes.map((t) => (
            <a
              key={t}
              href={`/tim-kiem?theme=${encodeURIComponent(t!)}`}
              aria-current={theme === t ? "true" : undefined}
              className={cn(
                "shrink-0 snap-start rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                theme === t
                  ? "border-dat-700 bg-dat-700 text-white"
                  : "border-cream-200 bg-white text-ink-soft hover:border-dat-300 hover:text-ink"
              )}
            >
              {t}
            </a>
          ))}
        </div>
      )}

      <div className="mt-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3" aria-label="Đang tải sản phẩm">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-cream-200 bg-white">
                <Skeleton className="aspect-square rounded-none" />
                <div className="space-y-2 p-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <p className="text-red-600">Không tải được sản phẩm.</p>
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={<SearchX className="h-12 w-12 text-ink-faint" aria-hidden />}
            title="Không tìm thấy sản phẩm"
            hint="Thử từ khóa hoặc bộ lọc khác"
            action={
              <button
                onClick={clearFilters}
                className="rounded-md border border-cream-200 bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-cream-50 active:translate-y-px"
              >
                Xóa bộ lọc
              </button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {data.items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <nav
              aria-label="Phân trang sản phẩm"
              className="mt-8 flex items-center justify-center gap-2 text-sm"
            >
              <button
                onClick={() => goTo(page - 1)}
                disabled={page <= 1 || isLoading}
                className="rounded-md border border-cream-200 bg-white px-4 py-2 text-ink transition-colors hover:bg-cream-50 disabled:opacity-40"
              >
                Trước
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i + 1)}
                  disabled={isLoading}
                  aria-current={page === i + 1 ? "page" : undefined}
                  aria-label={`Trang ${i + 1}`}
                  className={cn(
                    "h-9 w-9 rounded-md border text-sm font-semibold transition-colors disabled:opacity-40",
                    page === i + 1
                      ? "border-dat-700 bg-dat-700 text-white"
                      : "border-cream-200 bg-white text-ink hover:bg-cream-50"
                  )}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => goTo(page + 1)}
                disabled={page >= totalPages || isLoading}
                className="rounded-md border border-cream-200 bg-white px-4 py-2 text-ink transition-colors hover:bg-cream-50 disabled:opacity-40"
              >
                Sau
              </button>
            </nav>
          </>
        )}
      </div>
    </div>
  );
}
