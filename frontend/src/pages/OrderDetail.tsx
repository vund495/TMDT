import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, Truck } from "lucide-react";
import { Money, Spinner, StatusBadge } from "../components/ui";
import { confirmReceipt, cancelOrder, getOrder, getShipmentOfOrder } from "../lib/api";

export default function OrderDetail() {
  const { id = "" } = useParams();
  const qc = useQueryClient();

  const order = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrder(id),
    enabled: !!id,
  });
  const shipment = useQuery({
    queryKey: ["order", id, "shipment"],
    queryFn: () => getShipmentOfOrder(id),
    enabled: !!id,
  });

  const confirm = useMutation({
    mutationFn: () => confirmReceipt(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order", id] });
      qc.invalidateQueries({ queryKey: ["passport"] });
    },
  });
  const cancel = useMutation({
    mutationFn: () => cancelOrder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["order", id] }),
  });

  if (order.isLoading) return <Spinner />;
  if (order.isError || !order.data) return <p className="text-red-600">Không tìm thấy đơn hàng.</p>;

  const o = order.data;
  const shipmentData = shipment.data;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ceramic-900">{o.code}</h1>
        <StatusBadge status={o.status} />
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Đặt lúc {new Date(o.created_at).toLocaleString("vi-VN")}
      </p>

      <section className="mt-6 rounded-xl border border-ceramic-100 bg-white p-5">
        <h2 className="font-semibold text-ceramic-900">Sản phẩm</h2>
        <div className="mt-3 space-y-2">
          {(o.items ?? []).map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-2 text-sm">
              <div className="min-w-0">
                <Link to={`/san-pham/${i.product_id}`} className="text-gray-700 hover:underline">
                  {i.product_name} × {i.quantity}
                </Link>
                {i.passport_qr && (
                  <Link
                    to={`/ho-chieu?code=${encodeURIComponent(i.passport_qr)}`}
                    className="ml-2 inline-flex items-center gap-1 rounded-md bg-brand-lam/10 px-2 py-0.5 text-xs font-semibold text-brand-lam hover:bg-brand-lam/20"
                  >
                    🪪 QR hộ chiếu: {i.passport_qr}
                  </Link>
                )}
              </div>
              <Money value={i.unit_price * i.quantity} />
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Tạm tính</span>
            <Money value={o.subtotal} />
          </div>
          {o.discount_amount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Giảm giá</span>
              <span className="text-red-500">−<Money value={o.discount_amount} /></span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Phí vận chuyển</span>
            <Money value={o.shipping_fee} />
          </div>
          <div className="flex justify-between border-t pt-2 font-bold">
            <span>Thành tiền</span>
            <Money value={o.total} />
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-ceramic-100 bg-white p-5">
        <h2 className="flex items-center gap-2 font-semibold text-ceramic-900">
          <Truck className="h-4 w-4" /> Vận chuyển
        </h2>
        <p className="mt-2 text-sm text-gray-700">
          {o.receiver_name} · {o.receiver_phone}
        </p>
        <p className="text-sm text-gray-700">{o.shipping_address}</p>
        {shipmentData && (
          <div className="mt-2 text-sm">
            <StatusBadge status={shipmentData.status} />
            {shipmentData.tracking_code && (
              <span className="ml-2 text-gray-600">Mã vận đơn: {shipmentData.tracking_code}</span>
            )}
          </div>
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        {o.status === "pending_payment" && (
          <button
            onClick={() => cancel.mutate()}
            disabled={cancel.isPending}
            className="rounded-lg bg-gray-100 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            Hủy đơn
          </button>
        )}
        {o.status === "shipping" && (
          <button
            onClick={() => confirm.mutate()}
            disabled={confirm.isPending}
            className="flex items-center gap-2 rounded-lg bg-brand-lam px-5 py-2.5 font-semibold text-white hover:bg-brand-lam/90 disabled:opacity-50"
          >
            <Award className="h-4 w-4" /> Đã nhận hàng & mở hộ chiếu
          </button>
        )}
      </div>
      {confirm.isError && <p className="mt-2 text-sm text-red-600">{(confirm.error as Error).message}</p>}
      {confirm.isSuccess && (
        <p className="mt-2 text-sm text-green-600">Đã mở khóa hộ chiếu! Xem tại <Link to="/ho-chieu" className="underline">Hộ chiếu của tôi</Link>.</p>
      )}

      {o.status === "shipping" && (
        <p className="mt-5 text-xs text-gray-500">
          💡 Sản phẩm được đóng gói chống sốc theo tiêu chuẩn "Vỡ 1 đền 1". Nếu vỡ khi vận chuyển, bạn có thể tạo khiếu nại.
        </p>
      )}
    </div>
  );
}
