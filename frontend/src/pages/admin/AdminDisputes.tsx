import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Spinner, StatusBadge } from "../../components/ui";
import { RESOLUTION_LABEL } from "../../utils/status";
import { listDisputes, resolveDispute } from "../../lib/api";
import type { Dispute } from "../../types";

export default function AdminDisputes() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["admin-disputes"], queryFn: listDisputes });

  const [resolving, setResolving] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState("");
  const [note, setNote] = useState("");

  const RESOLUTION_OPTIONS: Array<{ value: string; label: string }> = [
    { value: "approved", label: "Chấp thuận - hoàn tiền" },
    { value: "reship", label: "Chấp thuận - gửi hàng thay thế" },
    { value: "rejected", label: "Từ chối" },
  ];

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
                  <div className="mt-2 rounded-md bg-gray-50 p-2 text-sm text-gray-700">
                    <p>Kết quả: <span className="font-semibold">{RESOLUTION_LABEL[d.resolution] ?? d.resolution}</span></p>
                    {d.admin_note && <p className="mt-1 text-gray-500">Ghi chú admin: {d.admin_note}</p>}
                  </div>
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
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Kết quả xử lý</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Chọn quyết định...
                </option>
                {RESOLUTION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
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
