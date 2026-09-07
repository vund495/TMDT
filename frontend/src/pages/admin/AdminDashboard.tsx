import { useQuery } from "@tanstack/react-query";
import { DollarSign, HandCoins, Package, ShieldAlert, Store, TrendingUp, Users } from "lucide-react";
import { Spinner } from "../../components/ui";
import { getStats, listPendingProducts, listPendingWorkshops } from "../../lib/api";

export default function AdminDashboard() {
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: getStats });
  const pws = useQuery({ queryKey: ["admin-pending-w"], queryFn: listPendingWorkshops });
  const pps = useQuery({ queryKey: ["admin-pending-p"], queryFn: () => listPendingProducts() });

  if (stats.isLoading) return <Spinner />;

  const s = stats.data;

  const cards = [
    { label: "Doanh thu nền tảng", value: s ? s.total_revenue.toLocaleString("vi-VN") + "₫" : "-", icon: DollarSign },
    { label: "Hoa hồng thu được", value: s ? s.total_commission.toLocaleString("vi-VN") + "₫" : "-", icon: TrendingUp },
    { label: "Đã chi trả xưởng", value: s ? s.total_payout.toLocaleString("vi-VN") + "₫" : "-", icon: HandCoins },
    { label: "Lợi nhuận ròng", value: s ? s.gross_profit.toLocaleString("vi-VN") + "₫" : "-", icon: Package },
    { label: "Đã hoàn tiền", value: s ? s.total_refunded.toLocaleString("vi-VN") + "₫" : "-", icon: ShieldAlert },
  ];

  const kpi = [
    { label: "Đơn hàng", value: String(s?.orders_count ?? "-") },
    { label: "Xưởng gốm", value: String(s?.workshops_count ?? "-") },
    { label: "Khách hàng", value: String(s?.customers_count ?? "-") },
    { label: "Khiếu nại chờ xử lý", value: String(s?.disputes_pending ?? "-") },
  ];

  const maxByWorkshop = Math.max(1, ...(s?.revenue_by_workshop ?? []).map((r) => r.gross_amount));
  const maxByPeriod = Math.max(1, ...(s?.revenue_by_period ?? []).map((r) => r.gross_amount));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Tổng quan nền tảng</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4">
            <Icon className="h-5 w-5 text-slate-500" />
            <div className="mt-3 text-lg font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpi.map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">Doanh thu theo xưởng</h2>
          {(s?.revenue_by_workshop ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">Chưa có dữ liệu.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {(s?.revenue_by_workshop ?? []).slice(0, 6).map((r) => (
                <li key={r.workshop_name}>
                  <div className="flex justify-between text-sm">
                    <span className="truncate text-gray-700">{r.workshop_name}</span>
                    <span className="font-medium">{r.gross_amount.toLocaleString("vi-VN")}₫</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-dat-600"
                      style={{ width: `${Math.max(4, (r.gross_amount / maxByWorkshop) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">Doanh thu theo kỳ</h2>
          {(s?.revenue_by_period ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">Chưa có dữ liệu.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {(s?.revenue_by_period ?? []).slice(0, 8).map((r) => (
                <li key={r.period}>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">{r.period}</span>
                    <span className="font-medium">{r.gross_amount.toLocaleString("vi-VN")}₫</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-brand-lam"
                      style={{ width: `${Math.max(4, (r.gross_amount / maxByPeriod) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">Xưởng chờ duyệt ({pws.data?.length ?? 0})</h2>
          {pws.data?.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">Không có.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {(pws.data ?? []).slice(0, 5).map((w) => (
                <li key={w.id} className="flex justify-between border-b border-gray-100 py-1">
                  <span className="font-medium">{w.name}</span>
                  <span className="text-gray-500">chờ duyệt</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">Sản phẩm chờ duyệt ({pps.data?.items?.length ?? 0})</h2>
          {(pps.data?.items ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">Không có.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {(pps.data?.items ?? []).slice(0, 5).map((p) => (
                <li key={p.id} className="flex justify-between border-b border-gray-100 py-1">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-gray-500">chờ duyệt</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
