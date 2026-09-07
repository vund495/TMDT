import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { Money, Spinner, StatusBadge, toastError } from "../../components/ui";
import { getStats, listRevenueRecords, markPayoutPaid, reconcileRevenue } from "../../lib/api";

export default function AdminReconcile() {
  const qc = useQueryClient();
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: getStats });
  const [result, setResult] = useState<Awaited<ReturnType<typeof reconcileRevenue>> | null>(null);

  const records = useQuery({
    queryKey: ["reconcile-records"],
    queryFn: () => listRevenueRecords(),
  });

  const run = useMutation({
    mutationFn: reconcileRevenue,
    onSuccess: (r) => {
      setResult(r);
      qc.invalidateQueries({ queryKey: ["reconcile-records"] });
    },
  });

  const markPaid = useMutation({
    mutationFn: markPayoutPaid,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reconcile-records"] });
    },
    onError: (e) => toastError((e as Error).message),
  });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900">Đối soát doanh thu</h1>
      <p className="mt-1 text-sm text-gray-600">
        Kiểm tra tính nhất quán giữa doanh thu đã ghi nhận (revenue_records) và tổng đơn hàng hoàn tất
        trên toàn sàn, sau đó chuyển tiền về cho xưởng theo từng kỳ.
      </p>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Doanh thu nền tảng hiện tại</div>
            <div className="mt-1 text-xl font-bold text-gray-900">
              {stats.isLoading ? "-" : <Money value={stats.data?.total_revenue ?? 0} />}
            </div>
          </div>
          <button
            onClick={() => run.mutate()}
            disabled={run.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${run.isPending ? "animate-spin" : ""}`} />
            {run.isPending ? "Đang đối soát..." : "Chạy đối soát"}
          </button>
        </div>

        {run.isError && <p className="mt-4 text-sm text-red-600">{(run.error as Error).message}</p>}

        {result && (
          <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              {result.consistent ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-green-700">Khớp - doanh thu nhất quán</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-700">Chênh lệch - cần kiểm tra</span>
                </>
              )}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500">Doanh thu đã ghi nhận</dt>
                <dd className="font-semibold"><Money value={result.total_revenue} /></dd>
              </div>
              <div>
                <dt className="text-gray-500">Doanh thu đơn hoàn tất</dt>
                <dd className="font-semibold"><Money value={result.total_orders_revenue} /></dd>
              </div>
              <div>
                <dt className="text-gray-500">Số dòng revenue_records</dt>
                <dd className="font-semibold">{result.revenue_records_count}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-gray-900">Các kỳ chờ chuyển tiền</h2>
        {records.isLoading ? (
          <Spinner />
        ) : !records.data || records.data.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            Chưa có dòng đối soát nào. Chạy nút "Đối soát doanh thu" để tạo dữ liệu.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3">Kỳ</th>
                  <th className="px-4 py-3 text-right">Doanh thu</th>
                  <th className="px-4 py-3 text-right">Hoa hồng</th>
                  <th className="px-4 py-3 text-right">Tiền chuyển cho xưởng</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {records.data.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium">{r.period}</td>
                    <td className="px-4 py-3 text-right"><Money value={r.gross_amount} /></td>
                    <td className="px-4 py-3 text-right text-red-600">-<Money value={r.commission_amount} /></td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700"><Money value={r.payout_amount} /></td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.payout_status} />
                      {r.payout_date && (
                        <span className="ml-2 text-xs text-gray-400">
                          {new Date(r.payout_date).toLocaleDateString("vi-VN")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.payout_status === "pending" ? (
                        <button
                          onClick={() => markPaid.mutate(r.id)}
                          disabled={markPaid.isPending}
                          className="rounded-md bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                        >
                          Đã chuyển tiền
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Đã hoàn tất</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}