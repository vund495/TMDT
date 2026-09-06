import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { Money, Spinner } from "../../components/ui";
import { getStats, reconcileRevenue } from "../../lib/api";

export default function AdminReconcile() {
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: getStats });
  const [result, setResult] = useState<Awaited<ReturnType<typeof reconcileRevenue>> | null>(null);

  const run = useMutation({
    mutationFn: reconcileRevenue,
    onSuccess: (r) => setResult(r),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Đối soát doanh thu</h1>
      <p className="mt-1 text-sm text-gray-600">
        Kiểm tra tính nhất quán giữa doanh thu đã ghi nhận (revenue_records) và tổng đơn hàng hoàn tất
        trên toàn sàn.
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
    </div>
  );
}
