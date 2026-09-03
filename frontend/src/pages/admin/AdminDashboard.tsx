import { useQuery } from "@tanstack/react-query";
import { DollarSign, Package, ShieldAlert, Store, Users } from "lucide-react";
import { Spinner } from "../../components/ui";
import { getStats, listPendingProducts, listPendingWorkshops } from "../../lib/api";

export default function AdminDashboard() {
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: getStats });
  const pws = useQuery({ queryKey: ["admin-pending-w"], queryFn: listPendingWorkshops });
  const pps = useQuery({ queryKey: ["admin-pending-p"], queryFn: listPendingProducts });

  if (stats.isLoading) return <Spinner />;

  const s = stats.data;

  const cards = [
    { label: "Doanh thu nền tảng", value: s ? s.total_revenue.toLocaleString("vi-VN") + "₫" : "—", icon: DollarSign },
    { label: "Đơn hàng", value: String(s?.orders_count ?? "—"), icon: Package },
    { label: "Xưởng gốm", value: String(s?.workshops_count ?? "—"), icon: Store },
    { label: "Khách hàng", value: String(s?.customers_count ?? "—"), icon: Users },
    { label: "Khiếu nại chờ xử lý", value: String(s?.disputes_pending ?? "—"), icon: ShieldAlert },
  ];

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
          <h2 className="font-semibold text-gray-900">Sản phẩm chờ duyệt ({pps.data?.length ?? 0})</h2>
          {pps.data?.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">Không có.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {(pps.data ?? []).slice(0, 5).map((p) => (
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
