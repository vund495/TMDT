import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "Cửa hàng", end: true },
  { to: "/workshop", label: "Xưởng gốm" },
  { to: "/admin", label: "Quản trị" },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-ceramic-50">
      <header className="border-b border-ceramic-100 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-3">
          <span className="mr-6 font-bold text-ceramic-900">Gốm Bát Tràng</span>
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
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
}
