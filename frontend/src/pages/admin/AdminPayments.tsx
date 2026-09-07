import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Landmark, Undo2 } from "lucide-react";
import { Money, Spinner } from "../../components/ui";
import { listAdminPayments } from "../../lib/api";
import type { Payment } from "../../types";

const PROVIDER_LABEL: Record<string, { label: string; Icon: typeof CreditCard }> = {
  vietqr: { label: "VietQR", Icon: Landmark },
  vnpay: { label: "VNPay", Icon: CreditCard },
  manual: { label: "Hoàn tiền thủ công", Icon: Undo2 },
};

const PROVIDERS: Array<"all" | "vietqr" | "vnpay"> = ["all", "vietqr", "vnpay"];

const REF_TYPE_LABEL: Record<string, string> = {
  order: "Đơn mua",
  tour: "Đặt tour",
  refund: "Hoàn tiền đơn",
  refund_tour: "Hoàn tiền tour",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  refunded: "Đã hoàn tiền",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-dat-50 text-dat-700 border-dat-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  refunded: "bg-men-50 text-men-700 border-men-200",
};

function fmtDateTime(d?: string) {
  if (!d) return "-";
  return new Date(d).toLocaleString("vi-VN");
}

export default function AdminPayments() {
  const [provider, setProvider] = useState<"all" | "vietqr" | "vnpay">("all");
  const [status, setStatus] = useState<"all" | "pending" | "paid" | "refunded">("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-payments", provider, status, page],
    queryFn: () =>
      listAdminPayments({
        provider: provider === "all" ? undefined : provider,
        status: status === "all" ? undefined : status,
        page,
        page_size: 15,
      }),
  });

  const current = data?.items ?? [];
  const totalPages = Math.max(1, data?.total_pages ?? 1);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Lịch sử giao dịch</h1>
      <p className="mt-1 text-sm text-gray-500">
        Tổng hợp thanh toán đơn hàng / đặt tour (VietQR) và hoàn tiền, kèm giao dịch qua cổng VNPay.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {PROVIDERS.map((p) => (
            <button
              key={p}
              onClick={() => {
                setProvider(p);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-sm ${
                provider === p ? "bg-white font-semibold text-brand-lam shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {p === "all" ? "Tất cả kênh" : PROVIDER_LABEL[p].label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {(["all", "pending", "paid", "refunded"] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-sm ${
                status === s ? "bg-white font-semibold text-brand-lam shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {s === "all" ? "Mọi trạng thái" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="text-red-600">Không tải được lịch sử giao dịch.</p>
        ) : current.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
            Chưa có giao dịch nào.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Kênh</th>
                  <th className="px-4 py-3">Loại giao dịch</th>
                  <th className="px-4 py-3">Tham chiếu</th>
                  <th className="px-4 py-3 text-right">Số tiền</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {current.map((p: Payment) => {
                  const meta = PROVIDER_LABEL[p.provider] ?? { label: p.provider, Icon: CreditCard };
                  const Icon = meta.Icon;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{meta.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{REF_TYPE_LABEL[p.ref_type] ?? p.ref_type}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {p.transaction_ref || p.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Money value={p.amount} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                            STATUS_CLASS[p.status] ?? "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {STATUS_LABEL[p.status] ?? p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{fmtDateTime(p.paid_at || p.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isError && current.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Trang {page} / {totalPages} - {(data?.total ?? 0).toLocaleString("vi-VN")} giao dịch
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-40"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
