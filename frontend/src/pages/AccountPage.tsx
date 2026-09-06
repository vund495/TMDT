import { Link } from "react-router-dom";
import { Amphora, Package, ScanLine, ShieldCheck, Ticket } from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function AccountPage() {
  const { profile } = useAuthStore();

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-ceramic-900">Tài khoản của tôi</h1>

      <div className="mt-6 rounded-xl border border-ceramic-100 bg-white p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Email</span>
          <span className="font-medium text-ceramic-900">{profile.email}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-gray-500">Họ tên</span>
          <span className="font-medium text-ceramic-900">{profile.full_name || "-"}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-gray-500">Số điện thoại</span>
          <span className="font-medium text-ceramic-900">{profile.phone || "-"}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-gray-500">Vai trò</span>
          <span className="rounded-full bg-brand-lam/10 px-3 py-0.5 text-sm font-medium text-brand-lam">
            {profile.role === "workshop_owner" ? "Xưởng gốm" : profile.role}
          </span>
        </div>
      </div>

      {/* Portal per role */}
      <div className="mt-6 grid gap-3">
        {profile.role === "workshop_owner" && (
          <Link to="/xuong" className="flex items-center gap-2 rounded-xl border border-dat-200 bg-dat-50 p-4 text-sm font-medium text-dat-700 hover:bg-dat-100">
            <Amphora className="h-4 w-4" aria-hidden /> Vào bảng điều khiển xưởng gốm <span aria-hidden>→</span>
          </Link>
        )}
        {profile.role === "admin" && (
          <Link to="/admin" className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm font-medium text-slate-700 hover:bg-slate-100">
            <ShieldCheck className="h-4 w-4" aria-hidden /> Vào trang quản trị <span aria-hidden>→</span>
          </Link>
        )}
        {profile.role === "customer" && (
          <>
            <Link to="/don-hang" className="flex items-center gap-2 rounded-xl border border-ceramic-100 bg-white p-4 text-sm font-medium text-ceramic-900 hover:shadow">
              <Package className="h-4 w-4" aria-hidden /> Đơn hàng của tôi <span aria-hidden>→</span>
            </Link>
            <Link to="/tour-cua-toi" className="flex items-center gap-2 rounded-xl border border-ceramic-100 bg-white p-4 text-sm font-medium text-ceramic-900 hover:shadow">
              <Ticket className="h-4 w-4" aria-hidden /> Tour của tôi <span aria-hidden>→</span>
            </Link>
            <Link to="/ho-chieu" className="flex items-center gap-2 rounded-xl border border-ceramic-100 bg-white p-4 text-sm font-medium text-ceramic-900 hover:shadow">
              <ScanLine className="h-4 w-4" aria-hidden /> Hộ chiếu sản phẩm <span aria-hidden>→</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
