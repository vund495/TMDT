import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { EmptyState, Spinner, StatusBadge } from "../components/ui";
import { RESOLUTION_LABEL } from "../utils/status";
import { createDispute, listMyDisputes, listOrders } from "../lib/api";
import { useAuthStore } from "../store/authStore";

export default function DisputesPage() {
  const qc = useQueryClient();
  const { profile } = useAuthStore();
  const isCustomer = profile?.role === "customer";

  const disputes = useQuery({ queryKey: ["my-disputes"], queryFn: listMyDisputes, enabled: isCustomer });
  const orders = useQuery({ queryKey: ["orders"], queryFn: listOrders, enabled: isCustomer });

  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createDispute({
        order_id: orderId,
        reason,
        evidence_urls: evidence
          ? evidence.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
      }),
    onSuccess: () => {
      setOrderId("");
      setReason("");
      setEvidence("");
      qc.invalidateQueries({ queryKey: ["my-disputes"] });
    },
  });

  const delivOrders = (orders.data ?? []).filter(
    (o) => o.status === "completed" || o.status === "disputing"
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-ceramic-900">Khiếu nại - Vỡ 1 đền 1</h1>

      {isCustomer && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (orderId && reason) create.mutate();
          }}
          className="mt-6 space-y-3 rounded-xl border border-ceramic-100 bg-white p-5"
        >
          <h2 className="font-semibold text-ceramic-900">Tạo khiếu nại</h2>
          <select
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Chọn đơn hàng đã nhận...</option>
            {delivOrders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.code}
              </option>
            ))}
          </select>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Mô tả tình trạng vỡ/hư hỏng, kèm lý do khiếu nại..."
            className="w-full rounded-md border border-gray-300 p-3 text-sm"
            rows={3}
          />
          <input
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="URL ảnh minh chứng (phân tách bằng dấu phẩy, tùy chọn)"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={create.isPending || !orderId || !reason}
            className="rounded-lg bg-dat-700 px-5 py-2.5 font-semibold text-white hover:bg-dat-800 disabled:opacity-50"
          >
            {create.isPending ? "Đang gửi..." : "Gửi khiếu nại"}
          </button>
          {create.isError && (
            <p className="text-sm text-red-600">{(create.error as Error).message}</p>
          )}
          {create.isSuccess && <p className="text-sm text-green-600">Khiếu nại đã gửi.</p>}
        </form>
      )}

      <div className="mt-6">
        {disputes.isLoading ? (
          <Spinner />
        ) : disputes.isError ? (
          <p className="text-red-600">Không tải được khiếu nại.</p>
        ) : !disputes.data || disputes.data.length === 0 ? (
          <EmptyState
            icon={<ShieldAlert className="h-12 w-12" />}
            title="Chưa có khiếu nại"
            hint="Sản phẩm vỡ khi vận chuyển? Hãy tạo khiếu nại để được đền bù."
          />
        ) : (
          <div className="space-y-3">
            {disputes.data.map((d) => (
              <div key={d.id} className="rounded-xl border border-ceramic-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-500">Đơn: {d.order_id.slice(0, 8)}...</span>
                  <StatusBadge status={d.status} />
                </div>
                <p className="mt-2 text-sm text-gray-700">{d.reason}</p>
                {d.resolution && (
                  <div className="mt-2 rounded-md bg-gray-50 p-2 text-sm text-gray-700">
                    <p>Kết quả: <span className="font-semibold">{RESOLUTION_LABEL[d.resolution] ?? d.resolution}</span></p>
                    {d.admin_note && <p className="mt-1 text-gray-500">Ghi chú: {d.admin_note}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
