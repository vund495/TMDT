import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

const navItems: NavItem[] = [
  { to: "/", label: "Cửa hàng", end: true },
  { to: "/workshop", label: "Xưởng gốm" },
  { to: "/admin", label: "Quản trị" },
];

export default function Layout() {
  const { profile, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-ceramic-50">
      <header className="border-b border-ceramic-100 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-3">
          <Link to="/" className="mr-6 font-bold text-ceramic-900">
            Gốm Bát Tràng
          </Link>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm font-medium ${
                  isActive
                    ? "bg-ceramic-500 text-white"
                    : "text-ceramic-700 hover:bg-ceramic-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <div className="ml-auto flex items-center gap-2 text-sm">
            {profile ? (
              <>
                <span className="text-gray-600">
                  {profile?.full_name || profile?.email || "..."}
                </span>
                <button
                  onClick={() => void logout()}
                  className="rounded-md border border-gray-300 px-3 py-1.5 font-medium hover:bg-gray-50"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-md bg-ceramic-500 px-3 py-1.5 font-medium text-white hover:bg-ceramic-700"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
}
