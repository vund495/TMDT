import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, RotateCcw } from "lucide-react";
import { EmptyState, Money, Spinner, StatusBadge } from "../components/ui";
import PayQRModal from "../components/PayQRModal";
import { listOrders } from "../lib/api";
import { toastOk } from "../lib/toast";

export default function OrdersList() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: listOrders,
    refetchInterval: 5000,
  });
  const [paying, setPaying] = useState<{ id: string; code: string } | null>(null);

  const prevPending = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!data) return;
    const prev = prevPending.current;
    for (const o of data) {
      if (o.status !== "pending_payment") {
        const was = prev.get(o.id);
        if (was === "pending_payment") {
          toastOk(`Đơn ${o.code} đã thanh toán thành công`);
        }
        prev.delete(o.id);
      } else {
        prev.set(o.id, o.status);
      }
    }
    prevPending.current = prev;
  }, [data]);

  const closePay = () => {
    setPaying(null);
    qc.invalidateQueries({ queryKey: ["orders"] });
  };

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
              <div
                key={o.id}
                className="flex items-center justify-between rounded-xl border border-ceramic-100 bg-white p-4 transition hover:shadow-md"
              >
                <Link to={`/don-hang/${o.id}`} className="flex-1 min-w-0">
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
                </Link>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <StatusBadge status={o.status} />
                    <div className="mt-1 font-semibold text-dat-700">
                      <Money value={o.total} />
                    </div>
                  </div>
                  {o.status === "pending_payment" && (
                    <button
                      onClick={() => setPaying({ id: o.id, code: o.code })}
                      className="rounded-lg bg-dat-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-dat-800"
                    >
                      Thanh toán
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {paying && (
        <PayQRModal
          open={!!paying}
          onClose={closePay}
          onPaid={() => {
            qc.invalidateQueries({ queryKey: ["orders"] });
          }}
          refType="order"
          refId={paying.id}
          label={`đơn ${paying.code}`}
        />
      )}
    </div>
  );
}
