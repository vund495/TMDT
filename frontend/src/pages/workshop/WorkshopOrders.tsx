import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes } from "lucide-react";
import { EmptyState, Money, Spinner, StatusBadge } from "../../components/ui";
import { listWorkshopOrders, shipOrder } from "../../lib/api";

export default function WorkshopOrders() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => listWorkshopOrders(),
  });

  const ship = useMutation({
    mutationFn: shipOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-orders"] }),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ceramic-900">Đơn hàng của xưởng</h1>
      <div className="mt-6">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="text-red-600">Không tải được đơn hàng.</p>
        ) : !data || data.length === 0 ? (
          <EmptyState icon={<Boxes className="h-12 w-12" />} title="Chưa có đơn hàng nào" />
        ) : (
          <div className="space-y-3">
            {data.map((o) => (
              <div key={o.id} className="rounded-xl border border-ceramic-100 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ceramic-900">{o.code}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {o.receiver_name} · {o.receiver_phone} · {o.shipping_address}
                    </p>
                  </div>
                  <div className="text-right">
                    <Money value={o.total} className="font-bold text-brand-dat" />
                    <div className="mt-2">
                      {o.status === "pending_payment" && (
                        <span className="text-xs text-gray-400">Chờ khách thanh toán</span>
                      )}
                      {o.status === "preparing" && (
                        <button
                          onClick={() => ship.mutate(o.id)}
                          disabled={ship.isPending}
                          className="rounded-md bg-brand-dat px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dat-700 disabled:opacity-50"
                        >
                          Xác nhận đã giao hàng
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
