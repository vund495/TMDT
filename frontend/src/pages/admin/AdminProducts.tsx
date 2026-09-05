import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Money, Spinner, StatusBadge } from "../../components/ui";
import { approveProduct, listPendingProducts, rejectProduct } from "../../lib/api";
import type { Product } from "../../types";

export default function AdminProducts() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["admin-pending-p", page],
    queryFn: () => listPendingProducts({ page, page_size: 20 }),
  });
  const totalPages = Math.max(1, data?.total_pages ?? 1);

  const [rejecting, setRejecting] = useState<Product | null>(null);
  const [reason, setReason] = useState("");

  const approve = useMutation({
    mutationFn: approveProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-pending-p"] }),
  });
  const reject = useMutation({
    mutationFn: () => rejectProduct(rejecting!.id, reason),
    onSuccess: () => {
      setRejecting(null);
      setReason("");
      qc.invalidateQueries({ queryKey: ["admin-pending-p"] });
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Kiểm duyệt sản phẩm</h1>
      <div className="mt-6">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="text-red-600">Không tải được.</p>
        ) : !data || data.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
            Không có sản phẩm nào chờ duyệt.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {data.items.map((p) => (
              <div key={p.id} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                  {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" /> : "🏺"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{p.name}</h3>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    <Money value={p.sale_price ?? p.original_price} />
                    <span className="ml-3 text-gray-400">Kho: {p.stock}</span>
                  </div>
                  {p.description && <p className="mt-1 line-clamp-2 text-sm text-gray-600">{p.description}</p>}
                </div>
                <div className="flex shrink-0 gap-2 self-center">
                  <button
                    onClick={() => approve.mutate(p.id)}
                    disabled={approve.isPending}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Duyệt
                  </button>
                  <button
                    onClick={() => setRejecting(p)}
                    className="rounded-md bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                ← Trước
              </button>
              <span className="px-2 text-gray-600">
                Trang {page} / {totalPages} — {(data?.total ?? 0).toLocaleString("vi-VN")} sản phẩm
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isFetching}
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Sau →
              </button>
            </div>
          </>
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
            <h2 className="font-bold text-gray-900">Từ chối sản phẩm: {rejecting.name}</h2>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Lý do từ chối (sẽ hiện cho xưởng) *"
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
