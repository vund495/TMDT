import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Palette, Package, Receipt, Star } from "lucide-react";
import { Money, Spinner, StatusBadge } from "../../components/ui";
import {
  getMyWorkshop,
  getWorkshopRevenue,
  listMyProducts,
  listWorkshopOrders,
} from "../../lib/api";

export default function WorkshopDashboard() {
  const workshop = useQuery({ queryKey: ["my-workshop"], queryFn: getMyWorkshop, retry: false });
  const products = useQuery({
    queryKey: ["my-products"],
    queryFn: () => listMyProducts({ page_size: 100 }),
    enabled: !!workshop.data,
  });
  const orders = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => listWorkshopOrders(),
    enabled: !!workshop.data,
  });
  const revenue = useQuery({ queryKey: ["my-revenue"], queryFn: getWorkshopRevenue, enabled: !!workshop.data });

  if (workshop.isLoading) return <Spinner />;

  if (workshop.isError || !workshop.data) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-center gap-2 font-semibold text-amber-700">
          <AlertTriangle className="h-5 w-5" />
          Bạn chưa có gian hàng / gian hàng chưa được duyệt
        </div>
        <p className="mt-2 text-sm text-amber-700/80">
          Hoàn thiện hồ sơ xưởng gốm của bạn để bắt đầu đăng sản phẩm và nhận đơn hàng.
        </p>
        <Link to="/xuong/ho-so" className="mt-4 inline-block rounded-lg bg-dat-700 px-5 py-2.5 font-semibold text-white hover:bg-dat-800">
          Tạo hồ sơ xưởng
        </Link>
      </div>
    );
  }

  const w = workshop.data;
  const pendingCount = products.data?.items.filter((p) => p.status === "pending_review").length ?? 0;
  const toShip = orders.data?.filter((o) => o.status === "preparing").length ?? 0;
  const totalRevenue = revenue.data?.reduce((s, r) => s + r.payout_amount, 0) ?? 0;
  const productCount = products.data?.items.length ?? 0;
  const orderCount = orders.data?.length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ceramic-900">{w.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={w.status} />
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <Star className="h-3.5 w-3.5 fill-dat-400 text-dat-400" aria-hidden />
              {w.rating_avg?.toFixed?.(1) ?? "0.0"}
            </span>
          </div>
        </div>
        <Link to="/xuong/ho-so" className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Chỉnh hồ sơ
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Sản phẩm", value: String(productCount), icon: Palette, to: "/xuong/san-pham" },
          { label: "Đơn hàng", value: String(orderCount), icon: Package, to: "/xuong/don-hang" },
          { label: "Sản phẩm chờ duyệt", value: String(pendingCount), icon: Receipt, to: "/xuong/san-pham" },
          { label: "Doanh thu nhận về", value: totalRevenue.toLocaleString("vi-VN") + "₫", icon: Palette, to: "/xuong/doanh-thu" },
        ].map(({ label, value, icon: Icon, to }) => (
          <Link key={label} to={to} className="rounded-xl border border-ceramic-100 bg-white p-4 shadow-sm transition hover:shadow-md">
            <Icon className="h-5 w-5 text-dat-700" />
            <div className="mt-3 text-xl font-bold text-ceramic-900">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </Link>
        ))}
      </div>

      {pendingCount > 0 && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Có {pendingCount} sản phẩm đang chờ admin duyệt. Sau khi được duyệt, sản phẩm sẽ xuất hiện công khai.
        </div>
      )}
      {toShip > 0 && (
        <div className="mt-3 rounded-lg border border-brand-lam/20 bg-brand-lam/5 p-4 text-sm text-brand-lam">
          Có {toShip} đơn đang chờ bạn chuẩn bị & giao hàng. Xem tại <Link to="/xuong/don-hang" className="underline">đơn hàng</Link>.
        </div>
      )}
    </div>
  );
}
