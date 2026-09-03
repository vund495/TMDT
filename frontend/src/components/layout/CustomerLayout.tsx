import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import { getCart } from "../../lib/api";
import { useLocalCart } from "../../store/localCartStore";
import { cn } from "../../utils/ui";

const NAV = [
  { to: "/", label: "Trang chủ" },
  { to: "/tim-kiem", label: "Khám phá sản phẩm" },
  { to: "/xuong-gom", label: "Xưởng gốm" },
  { to: "/tour", label: "Tour trải nghiệm" },
  { to: "/ho-chieu", label: "Hộ chiếu QR" },
];

const NAV_MOBILE = [
  { to: "/", label: "Trang chủ" },
  { to: "/tim-kiem", label: "Khám phá" },
  { to: "/xuong-gom", label: "Xưởng gốm" },
  { to: "/tour", label: "Tour" },
  { to: "/ho-chieu", label: "Hộ chiếu" },
];

export default function CustomerLayout() {
  const profile = useAuthStore((s) => s.profile);
  const isAuthed = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: () => getCart(),
    enabled: isAuthed,
  });
  const localCount = useLocalCart((s) => s.items.length);
  const cartCount = isAuthed
    ? (cartQuery.data?.items.length ?? 0) + localCount
    : localCount;

  const currentUser = profile;

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className="sticky top-0 z-40 border-b border-border-soft bg-bg-paper backdrop-blur-md min-h-20 transition-height duration-fast"
      >
        <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center gap-4 px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-men-700 text-lg text-white">
              🏺
            </span>
            <span className="text-xl font-extrabold tracking-tight text-ink">VietCraft Bát Tràng</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-cream-100 hover:text-ink",
                    isActive && "bg-cream-100 text-ink"
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/gio-hang"
              className="relative flex h-10 w-10 items-center justify-center rounded-md text-ink hover:bg-cream-100"
              title="Giỏ hàng"
            >
              🛒
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-men-700 px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(true)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-ink hover:bg-cream-100"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-men-700 text-sm text-white">
                    {(currentUser.full_name || "?").slice(0, 1)}
                  </span>
                  <span className="hidden sm:inline">{(currentUser.full_name || "").split(" ").pop()}</span>
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-2xl border border-border-soft bg-white shadow-elevated py-6">
                      <div className="border-b border-border-soft px-6 py-3">
                        <p className="truncate text-sm font-bold text-ink">{currentUser.full_name || ""}</p>
                        <p className="truncate text-xs text-ink-faint">{currentUser.email || ""}</p>
                      </div>
                      <nav className="mt-4 space-y-2">
                        <Link
                          to="/tai-khoan"
                          className="block px-4 py-2 text-sm text-ink hover:bg-cream-50"
                        >
                          Tài khoản
                        </Link>
                        <Link
                          to="/don-hang"
                          className="block px-4 py-2 text-sm text-ink hover:bg-cream-50"
                        >
                          Đơn hàng
                        </Link>
                        <Link
                          to="/tour-cua-toi"
                          className="block px-4 py-2 text-sm text-ink hover:bg-cream-50"
                        >
                          Tour của tôi
                        </Link>
                        <Link
                          to="/khieu-nai"
                          className="block px-4 py-2 text-sm text-ink hover:bg-cream-50"
                        >
                          Khiếu nại
                        </Link>
                        {currentUser.role === "workshop_owner" && (
                          <Link
                            to="/xuong"
                            className="block px-4 py-2 text-sm text-ink hover:bg-cream-50"
                          >
                            Vào khu xưởng →
                          </Link>
                        )}
                        {currentUser.role === "admin" && (
                          <Link
                            to="/admin"
                            className="block px-4 py-2 text-sm text-ink hover:bg-cream-50"
                          >
                            Vào khu quản trị →
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            logout();
                            setMenuOpen(false);
                            navigate("/");
                          }}
                          className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          Đăng xuất
                        </button>
                      </nav>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/dang-nhap"
                className="rounded-md bg-men-700 px-4 py-2 text-sm font-semibold text-white hover:bg-men-800 transition-colors duration-fast"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-border-soft bg-bg-paper">
        <div className="mx-auto w-full max-w-[1500px] gap-12 px-4 py-16 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-men-700 text-white">
                🏺
              </span>
              <span className="font-extrabold text-ink">VietCraft Bát Tràng</span>
            </div>
            <p className="mt-3 text-sm text-ink-soft">
              Nơi đất kể chuyện, lửa giữ hồn. Gốm sứ Bát Tràng chính gốc, minh bạch qua hộ chiếu QR.
            </p>
          </div>

          <div>
            <p className="label-sm mb-3 text-ink-faint">Khám phá</p>
            {["Sản phẩm", "Xưởng gốm", "Tour trải nghiệm", "Hộ chiếu QR"].map((x) => (
              <p key={x} className="py-1 text-sm text-ink-soft hover:text-ink">
                {x}
              </p>
            ))}
          </div>

          <div>
            <p className="label-sm mb-3 text-ink-faint">Hỗ trợ</p>
            {[
              { label: "Đơn hàng của tôi", to: "/don-hang" },
              { label: "Khiếu nại & hoàn trả", to: "/khieu-nai" },
              { label: "Chính sách đổi trả & bảo hành", to: "/chinh-sach" },
              { label: "Vận chuyển & thanh toán", to: "/chinh-sach" },
              { label: "Liên hệ", to: "/lien-he" },
            ].map((x) => (
              <Link key={x.label} to={x.to} className="block py-1 text-sm text-ink-soft hover:text-ink">
                {x.label}
              </Link>
            ))}
          </div>

          <div>
            <p className="label-sm mb-3 text-ink-faint">Liên hệ</p>
            <p className="py-1 text-sm text-ink-soft">Làng gốm Bát Tràng, Gia Lâm, Hà Nội</p>
            <p className="py-1 text-sm text-ink-soft">hotro@vietcraft.vn</p>
          </div>
        </div>
        <div className="border-t border-border-soft py-4 text-center text-xs text-ink-faint">
          © 2026 VietCraft Bát Tràng — Sàn gốm sứ Bát Tràng
        </div>
      </footer>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-bg-ink/80 backdrop-blur-md">
          <div className="absolute top-0 left-0 right-0 h-24 border-b border-border-soft bg-bg-paper">
            <div className="mx-auto max-w-[1500px] h-full px-4 flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-men-700 text-lg text-white">
                  🏺
                </span>
                <span className="text-xl font-extrabold tracking-tight text-ink">VietCraft Bát Tràng</span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-ink hover:bg-cream-100"
              >
                Đóng
              </button>
            </div>
          </div>
          <div className="pt-6 pb-8 overflow-y-auto">
            <nav className="space-y-3">
              {NAV_MOBILE.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="block px-4 py-2 rounded-md text-lg font-medium text-ink hover:bg-cream-50 transition-colors duration-fast"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            {currentUser ? (
              <div className="mt-8 pt-8 border-t border-border-soft">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-men-700 text-sm text-white">
                    {(currentUser.full_name || "?").slice(0, 1)}
                  </span>
                  <span className="font-medium text-ink">{currentUser.full_name || ""}</span>
                </div>
                <p className="text-xs text-ink-faint">{currentUser.email || ""}</p>
                <div className="mt-4 space-y-2">
                  <Link
                    to="/tai-khoan"
                    className="block px-4 py-2 rounded-md text-sm text-ink hover:bg-cream-50"
                  >
                    Tài khoản
                  </Link>
                  <Link
                    to="/don-hang"
                    className="block px-4 py-2 rounded-md text-sm text-ink hover:bg-cream-50"
                  >
                    Đơn hàng
                  </Link>
                  <Link
                    to="/tour-cua-toi"
                    className="block px-4 py-2 rounded-md text-sm text-ink hover:bg-cream-50"
                  >
                    Tour của tôi
                  </Link>
                  <Link
                    to="/khieu-nai"
                    className="block px-4 py-2 rounded-md text-sm text-ink hover:bg-cream-50"
                  >
                    Khiếu nại
                  </Link>
                  {currentUser.role === "workshop_owner" && (
                    <Link
                      to="/xuong"
                      className="block px-4 py-2 rounded-md text-sm text-ink hover:bg-cream-50"
                    >
                      Vào khu xưởng →
                    </Link>
                  )}
                  {currentUser.role === "admin" && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 rounded-md text-sm text-ink hover:bg-cream-50"
                    >
                      Vào khu quản trị →
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                      navigate("/");
                    }}
                    className="w-full px-4 py-3 rounded-md text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-8 pt-8">
                <Link
                  to="/dang-nhap"
                  className="w-full px-4 py-3 rounded-md bg-men-700 text-lg text-white text-center font-semibold hover:bg-men-800 transition-colors duration-fast"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/dang-ky"
                  className="w-full px-4 py-3 rounded-md border border-border-soft text-lg text-ink text-center font-medium hover:bg-cream-50 transition-colors duration-fast"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}