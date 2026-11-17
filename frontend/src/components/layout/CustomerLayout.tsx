import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Amphora, Bell, Menu, ShoppingCart, X } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { getCart, listNotifications, markNotificationRead } from "../../lib/api";
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
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Đổi trang (kể cả back/forward) thì đóng mọi menu/drawer đang mở.
  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  // Chặn cuộn nền khi drawer mobile đang mở.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const notifQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: listNotifications,
    enabled: isAuthed,
  });
  const qc = useQueryClient();
  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: () => getCart(),
    enabled: isAuthed,
  });
  const localCount = useLocalCart((s) => s.items.length);
  const cartCount = isAuthed
    ? (cartQuery.data?.items.length ?? 0) + localCount
    : localCount;

  const unreadCount = notifQuery.data?.filter((n) => !n.is_read).length ?? 0;
  const recentNotifs = notifQuery.data?.slice(0, 8) ?? [];

  const currentUser = profile;

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className="sticky top-0 z-40 border-b border-border-soft bg-bg-paper backdrop-blur-md min-h-20 transition-height duration-fast"
      >
        <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center gap-2 px-4 sm:gap-4">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Mở menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-ink hover:bg-cream-100 md:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>

          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dat-700 text-white">
              <Amphora className="h-5 w-5" aria-hidden />
            </span>
            <span className="whitespace-nowrap text-lg font-extrabold tracking-tight text-ink sm:text-xl">
              <span className="sm:hidden">VietCraft</span>
              <span className="hidden sm:inline">VietCraft Bát Tràng</span>
            </span>
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

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            {isAuthed && (
              <div className="relative">
                <button
                  onClick={() => setNotifOpen((v) => !v)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-md text-ink hover:bg-cream-100"
                  title="Thông báo"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-dat-700 px-1 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                    <div className="absolute right-0 z-20 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border-soft bg-white shadow-elevated">
                      <div className="flex items-center justify-between border-b border-border-soft px-4 py-3">
                        <p className="text-sm font-bold text-ink">Thông báo</p>
                        <Link
                          to="/thong-bao"
                          onClick={() => setNotifOpen(false)}
                          className="text-xs font-medium text-brand-lam hover:underline"
                        >
                          Xem tất cả
                        </Link>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {recentNotifs.length === 0 ? (
                          <p className="px-4 py-6 text-center text-sm text-ink-faint">
                            Chưa có thông báo nào.
                          </p>
                        ) : (
                          recentNotifs.map((n) => (
                            <Link
                              key={n.id}
                              to="/thong-bao"
                              onClick={() => {
                                setNotifOpen(false);
                                if (!n.is_read) markRead.mutate(n.id);
                              }}
                              className={`block border-b border-border-soft px-4 py-3 hover:bg-cream-50 ${n.is_read ? "" : "bg-brand-lam/5"
                                }`}
                            >
                              <p className="text-sm font-semibold text-ink">
                                {n.is_read ? null : <span className="mr-1 inline-block h-2 w-2 rounded-full bg-men-700" />}
                                {n.title}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-xs text-ink-soft">{n.message}</p>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            <Link
              to="/gio-hang"
              className="relative flex h-10 w-10 items-center justify-center rounded-md text-ink hover:bg-cream-100"
              title="Giỏ hàng"
            >
              <ShoppingCart className="h-5 w-5" aria-hidden />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-dat-700 px-1 text-[10px] font-bold text-white">
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
                          to="/thong-bao"
                          className="block px-4 py-2 text-sm text-ink hover:bg-cream-50"
                        >
                          Thông báo
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
                className="whitespace-nowrap rounded-md bg-men-700 px-3 py-2 text-sm font-semibold text-white hover:bg-men-800 transition-colors duration-fast sm:px-4"
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
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-dat-700 text-white">
                <Amphora className="h-4 w-4" aria-hidden />
              </span>
              <span className="font-extrabold text-ink">VietCraft Bát Tràng</span>
            </div>
            <p className="mt-3 text-sm text-ink-soft">
              VietCraft Bát Tràng - Nền tảng thương mại điện tử kết nối trực tiếp xưởng sản xuất và người tiêu dùng. Cung cấp giải pháp quà tặng B2B/B2C và số hóa câu chuyện làng nghề thủ công.
            </p>
          </div>

          <div>
            <p className="label-sm mb-3 text-ink-faint">Khám phá</p>
            {[
              { label: "Sản phẩm", to: "/tim-kiem" },
              { label: "Xưởng gốm", to: "/xuong-gom" },
              { label: "Tour trải nghiệm", to: "/tour" },
              { label: "Hộ chiếu QR", to: "/ho-chieu" },
            ].map((x) => (
              <Link key={x.label} to={x.to} className="block py-1 text-sm text-ink-soft hover:text-ink">
                {x.label}
              </Link>
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
          © 2026 VietCraft Bát Tràng - Sàn gốm sứ Bát Tràng
        </div>
      </footer>

      {mobileOpen && (
        <div
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng"
          className="fixed inset-0 z-50 md:hidden"
        >
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-bg-paper shadow-elevated">
            <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border-soft px-4">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex min-w-0 items-center gap-2"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dat-700 text-white">
                  <Amphora className="h-4 w-4" aria-hidden />
                </span>
                <span className="truncate text-base font-extrabold tracking-tight text-ink">
                  VietCraft Bát Tràng
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Đóng menu"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-ink hover:bg-cream-100"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4">
              <nav className="space-y-1">
                {NAV_MOBILE.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-md px-3 py-3 text-base font-semibold text-ink transition-colors duration-fast hover:bg-cream-100"
                  >
                    {n.label}
                  </Link>
                ))}
              </nav>

              {currentUser ? (
                <div className="mt-6 border-t border-border-soft pt-6">
                  <div className="flex items-center gap-2 px-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-men-700 text-sm text-white">
                      {(currentUser.full_name || "?").slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{currentUser.full_name || ""}</p>
                      <p className="truncate text-xs text-ink-faint">{currentUser.email || ""}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    {[
                      { label: "Tài khoản", to: "/tai-khoan" },
                      { label: "Đơn hàng", to: "/don-hang" },
                      { label: "Tour của tôi", to: "/tour-cua-toi" },
                      { label: "Khiếu nại", to: "/khieu-nai" },
                    ].map((x) => (
                      <Link
                        key={x.to}
                        to={x.to}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-md px-3 py-2.5 text-sm font-medium text-ink hover:bg-cream-100"
                      >
                        {x.label}
                      </Link>
                    ))}
                    {currentUser.role === "workshop_owner" && (
                      <Link
                        to="/xuong"
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-md px-3 py-2.5 text-sm font-medium text-dat-700 hover:bg-cream-100"
                      >
                        Vào khu xưởng →
                      </Link>
                    )}
                    {currentUser.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-md px-3 py-2.5 text-sm font-medium text-dat-700 hover:bg-cream-100"
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
                      className="mt-2 w-full rounded-md px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 space-y-2 border-t border-border-soft px-3 pt-6">
                  <Link
                    to="/dang-nhap"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full rounded-md bg-men-700 px-4 py-3 text-center text-base font-semibold text-white transition-colors duration-fast hover:bg-men-800"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/dang-ky"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full rounded-md border border-border-soft px-4 py-3 text-center text-base font-medium text-ink transition-colors duration-fast hover:bg-cream-50"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}