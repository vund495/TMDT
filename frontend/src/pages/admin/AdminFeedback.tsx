import { useQuery } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { EmptyState, Spinner } from "../../components/ui";
import { listContactMessages } from "../../lib/api";

export default function AdminFeedback() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: listContactMessages,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Liên hệ & góp ý</h1>
      <p className="mt-1 text-sm text-gray-600">
        Các phản hồi khách hàng gửi qua form liên hệ ({data?.length ?? 0} tin nhắn).
      </p>

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="text-red-600">Không tải được liên hệ.</p>
        ) : !data || data.length === 0 ? (
          <EmptyState icon={<Inbox className="h-12 w-12" />} title="Chưa có phản hồi nào" />
        ) : (
          data.map((m) => (
            <div key={m.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">{m.name}</div>
                <span className="text-xs text-gray-400">
                  {m.created_at ? new Date(m.created_at).toLocaleString("vi-VN") : ""}
                </span>
              </div>
              <div className="text-xs text-gray-500">{m.email}</div>
              {m.subject && <div className="mt-2 text-sm font-medium text-gray-700">📌 {m.subject}</div>}
              <p className="mt-1 text-sm text-gray-600">{m.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
