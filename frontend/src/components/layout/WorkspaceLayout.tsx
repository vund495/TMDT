import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Amphora, LogOut, Search } from "lucide-react";
import { cn } from "../../utils/ui";
import { useAuthStore } from "../../store/authStore";

export interface NavGroup {
  title: string;
  items: { label: string; to: string }[];
}

export default function WorkspaceLayout({
  accent,
  gradient,
  eyebrow,
  title,
  nav,
  logoutLabel,
}: {
  accent: string; // lớp active dùng cho trạng thái
  gradient: string; // bg gradient sidebar
  eyebrow: string;
  title: string;
  nav: NavGroup[];
  logoutLabel: string;
}) {
  const logout = useAuthStore((s) => s.logout);
  const profile = useAuthStore((s) => s.profile);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-gradient-to-b p-4 text-white lg:flex",
          gradient
        )}
      >
        <Link to="/" className="flex items-center gap-2 px-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <Amphora className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-70">{eyebrow}</p>
            <p className="text-base font-extrabold leading-tight">{title}</p>
          </div>
        </Link>

        <div className="mt-6 flex-1 space-y-6 overflow-y-auto">
          {nav.map((group) => (
            <div key={group.title}>
              <p className="px-2 text-[10px] font-semibold uppercase tracking-wider opacity-50">
                {group.title}
              </p>
              <div className="mt-1 space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "block rounded-lg px-2 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white",
                        isActive && "bg-white/15 text-white"
                      )
                    }
                    end={item.to.endsWith("/xuong") || item.to.endsWith("/admin")}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-white/15 pt-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            <Search className="h-4 w-4" aria-hidden /> Xem sàn như khách
          </Link>
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-white/80 hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" aria-hidden /> {logoutLabel}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* mobile top bar */}
        <div
          className={cn(
            "flex items-center justify-between bg-gradient-to-r px-4 py-3 text-white lg:hidden",
            accent
          )}
        >
          <Link to="/" className="flex items-center gap-1.5 font-extrabold">
            <Amphora className="h-5 w-5" aria-hidden /> {title}
          </Link>
          <span className="text-sm">
            {profile?.full_name?.split(" ").pop()}
          </span>
        </div>
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
