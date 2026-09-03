import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Button, Field } from "../../components/ui";
import { toastError, toastOk } from "../../lib/toast";
import type { Role } from "../../types";

export default function Register() {
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "workshop_owner">("customer");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name || !email || !password) {
      toastError("Vui lòng điền đầy đủ họ tên, email và mật khẩu");
      return;
    }
    setBusy(true);
    try {
      const user = await register({
        email: email.trim(),
        password,
        full_name: name,
        phone: phone || undefined,
        role,
      });
      toastOk(`Đăng ký thành công. Xin chào, ${user.full_name || user.email}`);
      navigate(role === "workshop_owner" ? "/xuong" : "/");
    } catch (e) {
      toastError("Đăng ký thất bại", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const roles: { value: "customer" | "workshop_owner"; label: string; icon: string }[] = [
    { value: "customer", label: "Khách mua hàng", icon: "🛍️" },
    { value: "workshop_owner", label: "Chủ xưởng gốm", icon: "🏺" },
  ];

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-card">
        <h1 className="text-xl font-extrabold text-ink">Đăng ký tài khoản</h1>
        <p className="mt-1 text-sm text-ink-soft">Tạo tài khoản để mua sắm tại VietCraft Bát Tràng.</p>

        <div className="mt-5 space-y-3">
          <Field label="Họ tên" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn A" />
          <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <Field label="Số điện thoại" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxx" />
          <Field
            label="Mật khẩu"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tối thiểu 8 ký tự"
          />
        </div>

        <p className="mt-5 text-sm font-medium text-ink">Bạn đăng ký với vai trò</p>
        <div className="mt-2 grid gap-2">
          {roles.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left ${
                role === r.value ? "border-dat-700 bg-dat-50" : "border-cream-200 hover:border-dat-700"
              }`}
            >
              <span className="text-xl">{r.icon}</span>
              <span className="text-sm font-semibold text-ink">{r.label}</span>
            </button>
          ))}
        </div>

        <Button block className="mt-5" onClick={submit} disabled={busy}>
          {busy ? "Đang đăng ký…" : "Đăng ký"}
        </Button>

        <p className="mt-4 text-center text-sm text-ink-soft">
          Đã có tài khoản?{" "}
          <Link to="/dang-nhap" className="font-semibold text-dat-700">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
