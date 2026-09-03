import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Spinner, StatusBadge } from "../../components/ui";
import { approveWorkshop, listPendingWorkshops, rejectWorkshop } from "../../lib/api";
import type { Workshop } from "../../types";

export default function AdminWorkshops() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-pending-w"],
    queryFn: listPendingWorkshops,
  });

  const [rejecting, setRejecting] = useState<Workshop | null>(null);
  const [reason, setReason] = useState("");

  const approve = useMutation({
    mutationFn: approveWorkshop,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-pending-w"] }),
  });
  const reject = useMutation({
    mutationFn: () => rejectWorkshop(rejecting!.id, reason),
    onSuccess: () => {
      setRejecting(null);
      setReason("");
      qc.invalidateQueries({ queryKey: ["admin-pending-w"] });
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Duyệt xưởng gốm</h1>
      <div className="mt-6">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="text-red-600">Không tải được.</p>
        ) : !data || data.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
            Không có xưởng nào chờ duyệt.
          </p>
        ) : (
          <div className="space-y-3">
            {data.map((w) => (
              <div key={w.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{w.name}</h3>
                      <StatusBadge status={w.status} />
                    </div>
                    {w.address && <p className="mt-1 text-sm text-gray-500">{w.address}</p>}
                    {w.description && <p className="mt-1 text-sm text-gray-600">{w.description}</p>}
                    <p className="mt-1 text-xs text-gray-400">Chủ: {w.owner_id}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approve.mutate(w.id)}
                      disabled={approve.isPending}
                      className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Duyệt
                    </button>
                    <button
                      onClick={() => setRejecting(w)}
                      className="rounded-md bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {rejecting && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setRejecting(null)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              if (reason) reject.mutate();
            }}
            className="w-full max-w-md space-y-3 rounded-xl bg-white p-6"
          >
            <h2 className="font-bold text-gray-900">Từ chối xưởng: {rejecting.name}</h2>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Lý do từ chối (sẽ hiện cho chủ xưởng) *"
              className="w-full rounded-md border border-gray-300 p-3 text-sm"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setRejecting(null)} className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
                Hủy
              </button>
              <button type="submit" disabled={reject.isPending || !reason} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Từ chối
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
