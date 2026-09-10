import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
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
// - Khoảng giá dùng 1 thanh trượt native (giá tối đa) + nhãn giá trị: đơn giản, không cần
//   thư viện slider bên thứ ba (input range chuẩn, a11y tốt). Kéo thanh chỉ cập nhật `priceDraft`
//   để xem trước; phải bấm "Áp dụng" mới commit vào state `price` → gọi API (max_price).
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
  const [price, setPrice] = useState<{ max?: number }>({});
  const [priceDraft, setPriceDraft] = useState<number | undefined>();
  const [material, setMaterial] = useState("");
  const [technique, setTechnique] = useState("");
  const [glaze, setGlaze] = useState("");

  useEffect(() => {
    setPage(1);
  }, [q, theme, workshopId, material, technique, glaze]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", "search", q, theme, workshopId, sort, page, price.max, material, technique, glaze],
    queryFn: () =>
      listProducts({
        q: q || undefined,
        theme: theme || undefined,
        workshop_id: workshopId || undefined,
        material: material || undefined,
        firing_technique: technique || undefined,
        glaze: glaze || undefined,
        sort: sort as never,
        page,
        page_size: 9,
        max_price: price.max,
      }),
  });

  // Giới hạn trên của thanh trượt giá; tối thiểu 2 triệu để có không gian kéo.
  const priceCeiling = useMemo(() => {
    const maxSeen = data?.items.reduce((m, p) => Math.max(m, p.sale_price ?? p.original_price), 0) ?? 0;
    return Math.max(2_000_000, Math.ceil((maxSeen * 1.2) / 100_000) * 100_000);
  }, [data]);

  const totalPages = Math.max(1, data?.total_pages ?? 1);
  const goTo = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0 });
  };

  const setPriceRange = (next: { max?: number }) => {
    setPrice(next);
    setPage(1);
  };

  // Giá trị hiển thị: ưu tiên draft đang kéo, nếu chưa chạm thì dùng filter đã áp dụng.
  const shownPrice = priceDraft ?? price.max ?? priceCeiling;

  const themes = useMemo(() => {
    const all = data?.items.map((p) => p.theme).filter(Boolean) as string[];
    return Array.from(new Set(all));
  }, [data]);

  const materials = useMemo(() => {
    const all = data?.items.map((p) => p.material).filter(Boolean) as string[];
    return Array.from(new Set(all));
  }, [data]);

  const techniques = useMemo(() => {
    const all = data?.items.map((p) => p.firing_technique).filter(Boolean) as string[];
    return Array.from(new Set(all));
  }, [data]);

  const glazes = useMemo(() => {
    const all = data?.items.map((p) => p.glaze).filter(Boolean) as string[];
    return Array.from(new Set(all));
  }, [data]);

  const clearFilters = () => {
    setSort("newest");
    setPrice({});
    setPriceDraft(undefined);
    setMaterial("");
    setTechnique("");
    setGlaze("");
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
        {materials.length > 1 && (
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            Chất liệu
            <select
              value={material}
              onChange={(e) => {
                setMaterial(e.target.value);
                goTo(1);
              }}
              className="rounded-md border border-cream-200 bg-white px-3 py-1.5 text-sm text-ink focus:border-dat-600 focus:outline-none focus:ring-2 focus:ring-dat-200"
            >
              <option value="">Tất cả</option>
              {materials.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        )}
        {techniques.length > 1 && (
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            Kỹ thuật nung
            <select
              value={technique}
              onChange={(e) => {
                setTechnique(e.target.value);
                goTo(1);
              }}
              className="rounded-md border border-cream-200 bg-white px-3 py-1.5 text-sm text-ink focus:border-dat-600 focus:outline-none focus:ring-2 focus:ring-dat-200"
            >
              <option value="">Tất cả</option>
              {techniques.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        )}
        {glazes.length > 1 && (
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            Men
            <select
              value={glaze}
              onChange={(e) => {
                setGlaze(e.target.value);
                goTo(1);
              }}
              className="rounded-md border border-cream-200 bg-white px-3 py-1.5 text-sm text-ink focus:border-dat-600 focus:outline-none focus:ring-2 focus:ring-dat-200"
            >
              <option value="">Tất cả</option>
              {glazes.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex items-center gap-3 text-sm text-ink-soft">
          <span>Giá</span>
          <input
            type="range"
            min={0}
            max={priceCeiling}
            step={priceCeiling / 100}
            value={shownPrice}
            onChange={(e) => setPriceDraft(Number(e.target.value))}
            aria-label="Giá tối đa"
            className="w-28 accent-dat-700"
          />
          <span className="whitespace-nowrap tabular-nums text-xs text-ink-faint">
            {shownPrice.toLocaleString("vi-VN")}đ
          </span>
          <button
            onClick={() => setPriceRange({ max: shownPrice >= priceCeiling ? undefined : shownPrice })}
            disabled={shownPrice === (price.max ?? priceCeiling)}
            className="rounded-md bg-dat-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-dat-800 disabled:opacity-40"
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
            <Link
              key={t}
              to={`/tim-kiem?theme=${encodeURIComponent(t!)}`}
              aria-current={theme === t ? "true" : undefined}
              className={cn(
                "shrink-0 snap-start rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                theme === t
                  ? "border-dat-700 bg-dat-700 text-white"
                  : "border-cream-200 bg-white text-ink-soft hover:border-dat-300 hover:text-ink"
              )}
            >
              {t}
            </Link>
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
