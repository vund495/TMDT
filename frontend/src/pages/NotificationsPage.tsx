import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { EmptyState, Spinner } from "../components/ui";
import { listNotifications, listNews, markNotificationRead } from "../lib/api";
import { cn } from "../utils/ui";

const TABS = [
  { value: "all", label: "Tất cả" },
  { value: "news", label: "Tin tức" },
];

export default function NotificationsPage() {
  const [tab, setTab] = useState("all");
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", tab],
    queryFn: () =>
      tab === "news" ? listNews() : listNotifications(),
  });

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const items = query.data ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-ceramic-900">Thông báo</h1>

      <div className="mt-4 flex gap-1 rounded-xl border border-border-soft bg-white p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium text-ink-soft hover:text-ink",
              tab === t.value && "bg-cream-100 text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {query.isLoading ? (
          <Spinner />
        ) : query.isError ? (
          <p className="text-red-600">Không tải được thông báo.</p>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-12 w-12" />}
            title="Chưa có thông báo"
            hint="Thông báo về đơn hàng, tour, khiếu nại và tin tức sẽ hiện tại đây."
          />
        ) : (
          <div className="space-y-2">
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.is_read) markRead.mutate(n.id);
                }}
                className={cn(
                  "block w-full rounded-xl border p-4 text-left transition-colors",
                  n.is_read
                    ? "border-border-soft bg-white"
                    : "border-brand-lam/30 bg-brand-lam/5"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-ink">{n.title}</p>
                  <span className="shrink-0 text-xs text-ink-faint">
                    {new Date(n.created_at).toLocaleString("vi-VN")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-soft">{n.message}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}