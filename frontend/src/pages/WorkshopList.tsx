import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Amphora, MapPin, Star } from "lucide-react";
import { EmptyState, Spinner } from "../components/ui";
import { listWorkshops } from "../lib/api";

export default function WorkshopList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["workshops"],
    queryFn: () => listWorkshops(),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ceramic-900">Các xưởng gốm làng nghề</h1>
      <p className="mt-1 text-sm text-gray-600">
        Khám phá gian hàng và câu chuyện của từng xưởng.
      </p>

      <div className="mt-6">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="text-red-600">Không tải được danh sách xưởng.</p>
        ) : !data || data.length === 0 ? (
          <EmptyState title="Chưa có xưởng nào" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((w) => (
              <Link
                key={w.id}
                to={`/xuong-gom/${w.id}`}
                className="rounded-xl border border-ceramic-100 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-cream-100">
                    {w.logo_url ? (
                      <img src={w.logo_url} alt={w.name} className="h-full w-full object-cover" />
                    ) : (
                      <Amphora className="h-6 w-6 text-ink-faint" aria-hidden />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-ceramic-900">{w.name}</h3>
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      <Star className="h-3.5 w-3.5 fill-dat-400 text-dat-400" aria-hidden />
                      {w.rating_avg?.toFixed?.(1) ?? "0.0"}
                    </p>
                  </div>
                </div>
                {w.description && <p className="mt-3 line-clamp-2 text-sm text-gray-600">{w.description}</p>}
                {w.address && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="h-3.5 w-3.5 text-ink-faint" aria-hidden /> {w.address}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
