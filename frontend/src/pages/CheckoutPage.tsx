import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Money, Spinner } from "../components/ui";
import { createOrder, getCart, validateVoucher } from "../lib/api";
import { useAuthStore } from "../store/authStore";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const cart = useQuery({ queryKey: ["cart"], queryFn: getCart, enabled: isAuthenticated });

  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [antiShock, setAntiShock] = useState(true);
  const [voucher, setVoucher] = useState("");
  const [voucherMsg, setVoucherMsg] = useState("");

  const checkVoucher = useMutation({
    mutationFn: () => validateVoucher(voucher),
    onSuccess: (d) =>
      setVoucherMsg(d.valid ? `✅ ${d.message} (giảm ${d.discount_percent}%)` : `❌ ${d.message}`),
    onError: (e) => setVoucherMsg(`❌ ${(e as Error).message}`),
  });

  const placeOrder = useMutation({
    mutationFn: () =>
      createOrder({
        items: (cart.data?.items ?? []).map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        voucher_code: voucher || undefined,
        receiver_name: receiverName,
        receiver_phone: receiverPhone,
        shipping_address: shippingAddress,
        anti_shock_packed: antiShock,
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      navigate(`/dat-hang-thanh-cong/${data.order.id}`, { state: { data } });
    },
  });

  if (!isAuthenticated)
    return (
      <div className="mx-auto max-w-md rounded-xl border border-ceramic-100 bg-white p-8 text-center">
        <p className="text-lg font-semibold text-ceramic-900">Vui lòng đăng nhập để thanh toán.</p>
        <Link
          to="/dang-nhap"
          className="mt-4 inline-block rounded-lg bg-brand-lam px-5 py-2.5 font-semibold text-white hover:bg-brand-lam/90"
        >
          Đăng nhập
        </Link>
      </div>
    );

  if (cart.isLoading) return <Spinner />;
  if (!cart.data || cart.data.items.length === 0)
    return <p className="text-gray-600">Giỏ hàng trống — hãy <a href="/tim-kiem" className="text-brand-lam underline">chọn sản phẩm</a>.</p>;

  const submitOrder = () => {
    if (!receiverName || !receiverPhone || !shippingAddress) return;
    placeOrder.mutate();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <section className="rounded-xl border border-ceramic-100 bg-white p-5">
          <h2 className="font-semibold text-ceramic-900">Thông tin nhận hàng</h2>
          <div className="mt-3 space-y-3">
            <input
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="Họ tên người nhận *"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
              placeholder="Số điện thoại *"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Địa chỉ giao hàng *"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={antiShock} onChange={(e) => setAntiShock(e.target.checked)} />
              Đóng gói chống sốc (bảo hành Vỡ 1 đền 1)
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-ceramic-100 bg-white p-5">
          <h2 className="font-semibold text-ceramic-900">Mã giảm giá</h2>
          <div className="mt-3 flex gap-2">
            <input
              value={voucher}
              onChange={(e) => setVoucher(e.target.value.toUpperCase())}
              placeholder="Nhập mã (VD: GIAM10)"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm uppercase"
            />
            <button
              onClick={() => voucher && checkVoucher.mutate()}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Áp dụng
            </button>
          </div>
          {voucherMsg && <p className="mt-2 text-sm">{voucherMsg}</p>}
        </section>
      </div>

      <div className="h-fit rounded-xl border border-ceramic-100 bg-white p-5">
        <h2 className="font-semibold text-ceramic-900">Đơn hàng của bạn</h2>
        <div className="mt-3 max-h-48 space-y-2 overflow-auto text-sm">
          {(cart.data.items ?? []).map((i) => (
            <div key={i.id} className="flex justify-between">
              <span className="text-gray-600">
                {i.product_name} × {i.quantity}
              </span>
              <Money value={i.subtotal ?? 0} />
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Tạm tính</span>
            <Money value={cart.data.total} />
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Phí vận chuyển</span>
            <span>20.000₫</span>
          </div>
        </div>
        <button
          onClick={submitOrder}
          disabled={placeOrder.isPending}
          className="mt-4 w-full rounded-lg bg-brand-lam px-5 py-2.5 font-semibold text-white hover:bg-brand-lam/90 disabled:opacity-50"
        >
          {placeOrder.isPending ? "Đang tạo đơn..." : "Tạo đơn & thanh toán VietQR"}
        </button>
        {placeOrder.isError && (
          <p className="mt-2 text-sm text-red-600">{(placeOrder.error as Error).message}</p>
        )}
      </div>
    </div>
  );
}
