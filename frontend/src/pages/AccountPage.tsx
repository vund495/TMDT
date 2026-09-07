import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Amphora, Package, ScanLine, ShieldCheck, Ticket } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { updateProfile } from "../lib/api";
import { toastError, toastOk } from "../components/ui";

export default function AccountPage() {
  const { profile, setProfile } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  if (!profile) return null;

  const dirty =
    fullName.trim() !== (profile.full_name ?? "") || phone.trim() !== (profile.phone ?? "");

  const save = async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      const updated = await updateProfile({
        full_name: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setProfile(updated);
      toastOk("Đã lưu thông tin cá nhân");
    } catch (e) {
      toastError("Lưu thất bại", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-ceramic-900">Tài khoản của tôi</h1>

      <div className="mt-6 rounded-xl border border-ceramic-100 bg-white p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Email</span>
          <span className="font-medium text-ceramic-900">{profile.email}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-gray-500">Vai trò</span>
          <span className="rounded-full bg-brand-lam/10 px-3 py-0.5 text-sm font-medium text-brand-lam">
            {profile.role === "workshop_owner" ? "Xưởng gốm" : profile.role}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-ceramic-100 bg-white p-5">
        <h2 className="font-semibold text-ceramic-900">Thông tin cá nhân</h2>
        <label className="mt-3 block text-sm">
          <span className="text-gray-600">Họ tên</span>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nguyễn Văn A"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-dat-600 focus:outline-none focus:ring-2 focus:ring-dat-200"
          />
        </label>
        <label className="mt-3 block text-sm">
          <span className="text-gray-600">Số điện thoại</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="0912345678"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-dat-600 focus:outline-none focus:ring-2 focus:ring-dat-200"
          />
        </label>
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="mt-4 rounded-lg bg-dat-700 px-5 py-2 text-sm font-semibold text-white hover:bg-dat-800 disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
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