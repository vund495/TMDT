import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Field, Money, Spinner, toastError } from "../components/ui";
import { createOrder, getCart, createVnpayPayment, validateVoucher, shippingQuote } from "../lib/api";
import type { VoucherValidateResult } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { VIETNAM_PROVINCES } from "../constants/provinces";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const cart = useQuery({ queryKey: ["cart"], queryFn: getCart, enabled: isAuthenticated });

  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingMethod, setShippingMethod] = useState<"pickup" | "delivery">("delivery");
  const [province, setProvince] = useState("");
  const [antiShock, setAntiShock] = useState(true);
  const [voucher, setVoucher] = useState("");
  const [voucherMsg, setVoucherMsg] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherValidateResult | null>(null);
  const [payMethod, setPayMethod] = useState<"vnpay" | "vietqr">("vnpay");
  const [tried, setTried] = useState(false);
  const phoneDigits = receiverPhone.replace(/\D/g, "");
  const nameError = tried && !receiverName.trim() ? "Nhập họ tên người nhận" : undefined;
  const phoneError = tried && phoneDigits.length < 9 ? "Nhập số điện thoại (ít nhất 9 chữ số)" : undefined;
  const addressError =
    tried && shippingMethod === "delivery" && !shippingAddress.trim() ? "Nhập địa chỉ giao hàng" : undefined;
  const provinceError =
    tried && shippingMethod === "delivery" && !province ? "Chọn tỉnh/thành" : undefined;

  const cartTotal = cart.data?.total ?? 0;

  const quote = useQuery({
    queryKey: ["shipping-quote", shippingMethod, province, cartTotal],
    queryFn: () =>
      shippingQuote({
        shipping_method: shippingMethod,
        shipping_province: province || undefined,
        subtotal: cartTotal,
      }),
    enabled: isAuthenticated && !!cart.data && shippingMethod === "delivery" && !!province,
  });
  const shippingFee = shippingMethod === "pickup" ? 0 : (quote.data?.fee ?? 0);

  const discount =
    appliedVoucher?.valid
      ? Math.min(
          Math.floor((cartTotal * (appliedVoucher.discount_percent ?? 0)) / 100),
          appliedVoucher.max_discount_amount ?? Number.POSITIVE_INFINITY,
        )
      : 0;
  const grandTotal = cartTotal - discount + shippingFee;

  const checkVoucher = useMutation({
    mutationFn: () => validateVoucher(voucher),
    onSuccess: (d) => {
      setAppliedVoucher(d.valid ? d : null);
      setVoucherMsg(
        d.valid
          ? `${d.message} (giảm ${d.discount_percent}%)`
          : (d.message ?? "Mã không hợp lệ"),
      );
    },
    onError: (e) => {
      setAppliedVoucher(null);
      setVoucherMsg((e as Error).message);
    },
  });

  const placeOrder = useMutation({
    mutationFn: () =>
      createOrder({
        items: (cart.data?.items ?? []).map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        voucher_code: voucher || undefined,
        receiver_name: receiverName,
        receiver_phone: receiverPhone,
        shipping_address: shippingAddress,
        shipping_method: shippingMethod,
        shipping_province: shippingMethod === "delivery" ? province || null : null,
        anti_shock_packed: antiShock,
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      if (payMethod === "vnpay") {
        if (!data.payment_id) {
          toastError("Lỗi", "Không có payment_id để tạo thanh toán VNPay");
          return;
        }
        createVnpayPayment(data.payment_id)
          .then((r) => {
            window.location.assign(r.pay_url);
          })
          .catch(() => navigate(`/dat-hang-thanh-cong/${data.order.id}`, { state: { data } }));
      } else {
        navigate(`/dat-hang-thanh-cong/${data.order.id}`, { state: { data } });
      }
    },
  });

  if (!isAuthenticated)
    return (
      <div className="mx-auto max-w-md rounded-xl border border-ceramic-100 bg-white p-8 text-center">
        <p className="text-lg font-semibold text-ceramic-900">Vui lòng đăng nhập để thanh toán.</p>
        <Link
          to="/dang-nhap"
          className="mt-4 inline-block rounded-lg bg-dat-700 px-5 py-2.5 font-semibold text-white hover:bg-dat-800"
        >
          Đăng nhập
        </Link>
      </div>
    );

  if (cart.isLoading) return <Spinner />;
  if (!cart.data || cart.data.items.length === 0)
    return <p className="text-gray-600">Giỏ hàng trống - hãy <Link to="/tim-kiem" className="text-brand-lam underline">chọn sản phẩm</Link>.</p>;

  const submitOrder = () => {
    setTried(true);
    if (!receiverName.trim() || phoneDigits.length < 9) return;
    if (shippingMethod === "delivery" && (!province || !shippingAddress.trim())) return;
    placeOrder.mutate();
  };

  const feeLabel = shippingMethod === "pickup"
    ? "Miễn phí"
    : !province
      ? "—"
      : quote.isFetching
        ? "..."
        : shippingFee === 0
          ? "Miễn phí"
          : <Money value={shippingFee} />;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <section className="rounded-xl border border-ceramic-100 bg-white p-5">
          <h2 className="font-semibold text-ceramic-900">Phương thức vận chuyển</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${
                shippingMethod === "delivery" ? "border-dat-600 bg-dat-50" : "border-gray-200 bg-white"
              }`}
            >
              <input
                type="radio"
                name="method"
                checked={shippingMethod === "delivery"}
                onChange={() => setShippingMethod("delivery")}
                className="mt-0.5 accent-dat-600"
              />
              <span>
                <span className="font-semibold text-ceramic-900">Giao tận nơi</span>
                <br />
                <span className="text-xs text-gray-500">
                  Hà Nội / TP.HCM: 15.000đ · Tỉnh khác: 35.000đ
                  <br />
                  Miễn phí cho đơn từ 500.000đ
                </span>
              </span>
            </label>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${
                shippingMethod === "pickup" ? "border-dat-600 bg-dat-50" : "border-gray-200 bg-white"
              }`}
            >
              <input
                type="radio"
                name="method"
                checked={shippingMethod === "pickup"}
                onChange={() => setShippingMethod("pickup")}
                className="mt-0.5 accent-dat-600"
              />
              <span>
                <span className="font-semibold text-ceramic-900">Khách tự đến lấy</span>
                <br />
                <span className="text-xs text-gray-500">Miễn phí vận chuyển - qua gian hàng xưởng</span>
              </span>
            </label>
          </div>

          {shippingMethod === "delivery" && (
            <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="province">
                  Tỉnh / Thành phố
                </label>
                <select
                  id="province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    provinceError
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-200 focus:border-dat-600 focus:ring-dat-200"
                  }`}
                >
                  <option value="">Chọn tỉnh/thành...</option>
                  {VIETNAM_PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                {provinceError && <p className="mt-1 text-xs text-red-600">{provinceError}</p>}
              </div>
              <Field
                label="Địa chỉ giao hàng"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Nhập địa chỉ (số nhà, đường, phường/xã, quận/huyện)"
                error={addressError}
              />
            </div>
          )}
        </section>

        <section className="rounded-xl border border-ceramic-100 bg-white p-5">
          <h2 className="font-semibold text-ceramic-900">Thông tin nhận hàng</h2>
          <div className="mt-3 space-y-3">
            <Field
              label="Họ tên người nhận"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="Nhập họ tên người nhận"
              error={nameError}
            />
            <Field
              label="Số điện thoại"
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
              placeholder="Nhập số điện thoại"
              inputMode="tel"
              error={phoneError}
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={antiShock} onChange={(e) => setAntiShock(e.target.checked)} />
              Đóng gói chống sốc (bảo hành Vỡ 1 đền 1)
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-ceramic-100 bg-white p-5">
          <h2 className="font-semibold text-ceramic-900">Mã giảm giá</h2>
          <Field
            label="Mã giảm giá"
            value={voucher}
            onChange={(e) => {
              setVoucher(e.target.value.toUpperCase());
              setAppliedVoucher(null);
            }}
            placeholder="Nhập mã giảm giá"
            input="uppercase"
            trailing={
              <button
                onClick={() => voucher && checkVoucher.mutate()}
                className="text-sm font-semibold text-dat-700 hover:text-dat-800"
              >
                Áp dụng
              </button>
            }
          />
          {voucherMsg && <p className="mt-2 text-sm">{voucherMsg}</p>}
        </section>

        <section className="rounded-xl border border-ceramic-100 bg-white p-5">
          <h2 className="font-semibold text-ceramic-900">Phương thức thanh toán</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${
                payMethod === "vnpay" ? "border-dat-600 bg-dat-50" : "border-gray-200 bg-white"
              }`}
            >
              <input
                type="radio"
                name="pay"
                checked={payMethod === "vnpay"}
                onChange={() => setPayMethod("vnpay")}
                className="accent-dat-600"
              />
              <img src="/images/vnpay.png" alt="VNPay" className="h-9 w-24 shrink-0 rounded-md object-contain" />
              <span>
                <span className="font-semibold text-ceramic-900">VNPay</span>
                <br />
                <span className="text-xs text-gray-500">Chuyển hướng sang cổng VNPay</span>
              </span>
            </label>
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${
                payMethod === "vietqr" ? "border-dat-600 bg-dat-50" : "border-gray-200 bg-white"
              }`}
            >
              <input
                type="radio"
                name="pay"
                checked={payMethod === "vietqr"}
                onChange={() => setPayMethod("vietqr")}
                className="accent-dat-600"
              />
              <img src="/images/vietqr.png" alt="VietQR" className="h-9 w-24 shrink-0 rounded-md object-contain" />
              <span>
                <span className="font-semibold text-ceramic-900">VietQR</span>
                <br />
                <span className="text-xs text-gray-500">Quét mã chuyển khoản ngân hàng</span>
              </span>
            </label>
          </div>
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
            <span>{feeLabel}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-men-700">
              <span>Giảm giá (mã {appliedVoucher?.code})</span>
              <span>-<Money value={discount} /></span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-100 pt-2 font-semibold text-ceramic-900">
            <span>Tổng cộng</span>
            <Money value={grandTotal} />
          </div>
        </div>
        <button
          onClick={submitOrder}
          disabled={placeOrder.isPending}
          className="mt-4 w-full rounded-lg bg-dat-700 px-5 py-2.5 font-semibold text-white hover:bg-dat-800 disabled:opacity-50"
        >
          {placeOrder.isPending ? "Đang tạo đơn..." : payMethod === "vnpay" ? "Tạo đơn & thanh toán qua VNPay" : "Tạo đơn & thanh toán VietQR"}
        </button>
        {placeOrder.isError && (
          <p className="mt-2 text-sm text-red-600">{(placeOrder.error as Error).message}</p>
        )}
      </div>
    </div>
  );
}