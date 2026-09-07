import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, PackageCheck, RotateCcw } from "lucide-react";
import { EmptyState, Money, Spinner, StatusBadge, toastError, toastOk } from "../../components/ui";
import { listWorkshopOrders, markOrderPacking, receiveReturnOrder, shipOrder } from "../../lib/api";

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

  const pack = useMutation({
    mutationFn: markOrderPacking,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      toastOk("Đã xác nhận đang đóng gói chống sốc");
    },
    onError: (e) => toastError((e as Error).message),
  });

  const receiveReturn = useMutation({
    mutationFn: receiveReturnOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      toastOk("Đã tiếp nhận kiện hàng hoàn");
    },
    onError: (e) => toastError((e as Error).message),
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
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ceramic-900">{o.code}</span>
                      <StatusBadge status={o.status} />
                      {o.replacement_of_id && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-brand-mun/10 px-2 py-0.5 text-xs font-semibold text-brand-mun">
                          <RotateCcw className="h-3 w-3" aria-hidden /> Đơn thay thế
                        </span>
                      )}
                      {o.status === "returned" && !o.replacement_of_id && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                          Boom hàng - chờ tiếp nhận kiện hoàn
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {o.receiver_name} · {o.receiver_phone} · {o.shipping_address}
                    </p>
                  </div>
                  <div className="text-right">
                    <Money value={o.total} className="font-bold text-dat-700" />
                    <div className="mt-2">
                      {o.status === "pending_payment" && (
                        <button
                          onClick={() => pack.mutate(o.id)}
                          disabled={pack.isPending}
                          className="rounded-md bg-dat-700 px-4 py-2 text-sm font-semibold text-white hover:bg-dat-800 disabled:opacity-50"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <PackageCheck className="h-4 w-4" aria-hidden /> Đang đóng gói
                          </span>
                        </button>
                      )}
                      {o.status === "preparing" && (
                        <button
                          onClick={() => ship.mutate(o.id)}
                          disabled={ship.isPending}
                          className="rounded-md bg-dat-700 px-4 py-2 text-sm font-semibold text-white hover:bg-dat-800 disabled:opacity-50"
                        >
                          Xác nhận đã giao hàng
                        </button>
                      )}
                      {o.status === "returned" && (
                        <button
                          onClick={() => receiveReturn.mutate(o.id)}
                          disabled={receiveReturn.isPending}
                          className="rounded-md bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                          Xác nhận đã nhận kiện hoàn
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
