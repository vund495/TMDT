import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { EmptyState, Spinner } from "../components/ui";
import { listProducts } from "../lib/api";

const SORTS = [
  { value: "newest", label: "Mới nhất" },
  { value: "price_asc", label: "Giá thấp → cao" },
  { value: "price_desc", label: "Giá cao → thấp" },
  { value: "best_seller", label: "Bán chạy" },
];

export default function SearchPage() {
  const [sp] = useSearchParams();
  const [sort, setSort] = useState("newest");
  const q = sp.get("q") ?? "";
  const theme = sp.get("theme") ?? "";
  const workshopId = sp.get("workshop_id") ?? "";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", "search", q, theme, workshopId, sort],
    queryFn: () =>
      listProducts({
        q: q || undefined,
        theme: theme || undefined,
        workshop_id: workshopId || undefined,
        sort: sort as never,
        page_size: 20,
      }),
  });

  const themes = useMemo(() => {
    const all = data?.items.map((p) => p.theme).filter(Boolean) as string[];
    return Array.from(new Set(all));
  }, [data]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ceramic-900">
        Khám phá{q ? `: “${q}”` : ""}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {themes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {themes.map((t) => (
              <a
                key={t}
                href={`/tim-kiem?theme=${encodeURIComponent(t!)}`}
                className={`rounded-full border px-3 py-1 text-xs ${
                  theme === t ? "border-brand-lam bg-brand-lam/10 text-brand-lam" : "border-gray-300 text-gray-600"
                }`}
              >
                {t}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="text-red-600">Không tải được sản phẩm.</p>
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="Không tìm thấy sản phẩm" hint="Thử từ khóa hoặc bộ lọc khác" />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
