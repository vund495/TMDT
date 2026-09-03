import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Spinner, StatusBadge } from "../../components/ui";
import { listDisputes, resolveDispute } from "../../lib/api";
import type { Dispute } from "../../types";

export default function AdminDisputes() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["admin-disputes"], queryFn: listDisputes });

  const [resolving, setResolving] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState("");
  const [note, setNote] = useState("");

  const resolve = useMutation({
    mutationFn: () => resolveDispute(resolving!.id, { resolution, admin_note: note || undefined }),
    onSuccess: () => {
      setResolving(null);
      setResolution("");
      setNote("");
      qc.invalidateQueries({ queryKey: ["admin-disputes"] });
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Xử lý khiếu nại</h1>
      <div className="mt-6">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="text-red-600">Không tải được.</p>
        ) : !data || data.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
            Không có khiếu nại.
          </p>
        ) : (
          <div className="space-y-3">
            {data.map((d) => (
              <div key={d.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Đơn: {d.order_id}</span>
                    <StatusBadge status={d.status} />
                  </div>
                  <button onClick={() => setResolving(d)} disabled={d.status === "resolved"} className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-40">
                    Xử lý
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-700">{d.reason}</p>
                {d.resolution && (
                  <p className="mt-2 rounded-md bg-gray-50 p-2 text-sm text-gray-600">Kết quả: {d.resolution}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {resolving && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setResolving(null)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              if (resolution) resolve.mutate();
            }}
            className="w-full max-w-md space-y-3 rounded-xl bg-white p-6"
          >
            <h2 className="font-bold text-gray-900">Xử lý khiếu nại</h2>
            <p className="text-sm text-gray-600">{resolving.reason}</p>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Kết quả xử lý * (VD: hoàn tiền, gửi lại hàng, từ chối...)"
              className="w-full rounded-md border border-gray-300 p-3 text-sm"
              rows={3}
            />
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú nội bộ (tùy chọn)"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setResolving(null)} className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
                Hủy
              </button>
              <button type="submit" disabled={resolve.isPending || !resolution} className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Xác nhận
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
