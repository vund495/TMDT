import { Link } from "react-router-dom";
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
          <span className="font-medium text-ceramic-900">{profile.full_name || "—"}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-gray-500">Số điện thoại</span>
          <span className="font-medium text-ceramic-900">{profile.phone || "—"}</span>
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
          <Link to="/xuong" className="rounded-xl border border-brand-dat/30 bg-brand-dat/5 p-4 text-sm font-medium text-brand-dat-700 hover:bg-brand-dat/10">
            🏺 Vào bảng điều khiển xưởng gốm →
          </Link>
        )}
        {profile.role === "admin" && (
          <Link to="/admin" className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm font-medium text-slate-700 hover:bg-slate-100">
            🛡️ Vào trang quản trị →
          </Link>
        )}
        {profile.role === "customer" && (
          <>
            <Link to="/don-hang" className="rounded-xl border border-ceramic-100 bg-white p-4 text-sm font-medium text-ceramic-900 hover:shadow">
              📦 Đơn hàng của tôi →
            </Link>
            <Link to="/tour-cua-toi" className="rounded-xl border border-ceramic-100 bg-white p-4 text-sm font-medium text-ceramic-900 hover:shadow">
              🎫 Tour của tôi →
            </Link>
            <Link to="/ho-chieu" className="rounded-xl border border-ceramic-100 bg-white p-4 text-sm font-medium text-ceramic-900 hover:shadow">
              🪪 Hộ chiếu sản phẩm →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
