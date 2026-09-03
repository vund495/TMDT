import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/ui";
import { toastError, toastOk } from "../../lib/toast";
import { inputClass } from "../../utils/ui";

const go = (role: string) =>
  role === "admin" ? "/admin" : role === "workshop_owner" ? "/xuong" : "/";

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function doLogin() {
    if (!email.trim() || !password) {
      toastError("Vui lòng nhập email và mật khẩu");
      return;
    }
    setBusy(true);
    try {
      const user = await login({ email: email.trim(), password });
      toastOk(`Xin chào, ${user.full_name || user.email}`);
      navigate(go(user.role));
    } catch (e) {
      toastError("Đăng nhập thất bại", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-card">
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-dat-700 text-2xl text-white">
            🏺
          </span>
          <h1 className="mt-3 text-xl font-extrabold text-ink">Đăng nhập VietCraft Bát Tràng</h1>
          <p className="mt-1 text-sm text-ink-soft">Nhập email và mật khẩu để tiếp tục</p>
        </div>

        <div className="mt-5 space-y-3">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass + " pl-9"}
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") doLogin();
              }}
              className={inputClass + " pl-9"}
            />
          </div>
          <Button block onClick={doLogin} disabled={busy}>
            {busy ? "Đang đăng nhập…" : "Đăng nhập"}
          </Button>
        </div>

        <p className="mt-4 text-center text-sm text-ink-soft">
          Chưa có tài khoản?{" "}
          <Link to="/dang-ky" className="font-semibold text-dat-700">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}
