import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Money, Spinner, StatusBadge } from "../../components/ui";
import { listAdminUsers, setUserActive } from "../../lib/api";
import type { AdminUser, Role } from "../../types";

const ROLE_LABEL: Record<string, string> = {
  customer: "Khách hàng",
  workshop_owner: "Chủ xưởng",
  admin: "Quản trị",
};

const ROLES: Array<Role | "all"> = ["all", "customer", "workshop_owner", "admin"];

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN").slice(0, 10);
}

export default function AdminUsers() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<Role | "all">("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-users", search, role, page],
    queryFn: () =>
      listAdminUsers({
        q: search || undefined,
        role: role === "all" ? undefined : role,
        page,
        page_size: 10,
      }),
  });

  const [confirming, setConfirming] = useState<AdminUser | null>(null);
  const toggle = useMutation({
    mutationFn: (u: AdminUser) => setUserActive(u.id, !u.is_active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setConfirming(null);
    },
  });

  const current = data?.items ?? [];
  const totalPages = Math.max(1, data?.total_pages ?? 1);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(q.trim());
            setPage(1);
          }}
          className="flex items-center gap-2"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm email / tên / SĐT..."
              className="w-72 rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <button className="rounded-md bg-brand-lam px-4 py-2 text-sm font-semibold text-white hover:bg-brand-lam/90">
            Tìm
          </button>
        </form>

        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => {
                setRole(r);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-sm ${
                role === r ? "bg-white font-semibold text-brand-lam shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {r === "all" ? "Tất cả" : ROLE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="text-red-600">Không tải được.</p>
        ) : current.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
            Không có người dùng nào.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Người dùng</th>
                  <th className="px-4 py-3">Vai trò</th>
                  <th className="px-4 py-3">Xưởng</th>
                  <th className="px-4 py-3 text-right">Đơn hàng</th>
                  <th className="px-4 py-3 text-right">Đã chi</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {current.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{u.full_name || "—"}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-gray-100 px-2 py-1 text-xs">{ROLE_LABEL[u.role] ?? u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{u.workshop_name || "—"}</td>
                    <td className="px-4 py-3 text-right">{u.orders_count ?? 0}</td>
                    <td className="px-4 py-3 text-right">
                      <Money value={u.total_spent ?? 0} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.is_active ? "active" : "blocked"} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setConfirming(u)}
                        disabled={toggle.isPending}
                        className={`rounded-md px-3 py-1.5 text-sm font-semibold disabled:opacity-50 ${
                          u.is_active
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                      >
                        {u.is_active ? "Khóa" : "Mở khóa"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isError && current.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Trang {page} / {totalPages} — {(data?.total ?? 0).toLocaleString("vi-VN")} người dùng
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-40"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirming(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">
              {confirming.is_active ? "Khóa tài khoản?" : "Mở khóa tài khoản?"}
            </h2>
            <p className="text-sm text-gray-600">
              {confirming.is_active ? (
                <>
                  Người dùng <b>{confirming.email}</b> sẽ không thể đăng nhập cho đến khi được mở khóa.
                </>
              ) : (
                <>
                  Cho phép <b>{confirming.email}</b> đăng nhập trở lại.
                </>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirming(null)} className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
                Hủy
              </button>
              <button
                onClick={() => toggle.mutate(confirming)}
                disabled={toggle.isPending}
                className={`rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                  confirming.is_active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {toggle.isPending ? "Đang cập nhật..." : confirming.is_active ? "Khóa" : "Mở khóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}