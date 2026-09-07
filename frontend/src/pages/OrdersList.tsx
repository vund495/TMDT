import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Package, RotateCcw } from "lucide-react";
import { EmptyState, Money, Spinner, StatusBadge } from "../components/ui";
import { listOrders } from "../lib/api";

export default function OrdersList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: listOrders,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ceramic-900">Đơn hàng của tôi</h1>
      <div className="mt-6">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="text-red-600">Không tải được đơn hàng.</p>
        ) : !data || data.length === 0 ? (
          <EmptyState icon={<Package className="h-12 w-12" />} title="Chưa có đơn hàng nào" hint="Hãy mua sắm để tích lũy hộ chiếu!" />
        ) : (
          <div className="space-y-3">
            {data.map((o) => (
              <Link
                key={o.id}
                to={`/don-hang/${o.id}`}
                className="flex items-center justify-between rounded-xl border border-ceramic-100 bg-white p-4 transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ceramic-900">{o.code}</span>
                    {o.replacement_of_id && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-brand-mun/10 px-2 py-0.5 text-[10px] font-bold text-brand-mun">
                        <RotateCcw className="h-3 w-3" aria-hidden /> Đơn thay thế
                      </span>
                    )}
                    {o.status === "returned" && !o.replacement_of_id && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                        Boom hàng
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    {new Date(o.created_at).toLocaleString("vi-VN")}
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={o.status} />
                  <div className="mt-1 font-semibold text-dat-700">
                    <Money value={o.total} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
