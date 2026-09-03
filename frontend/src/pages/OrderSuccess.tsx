import { Link, useLocation } from "react-router-dom";
import type { OrderCreateOut } from "../types";
import { Money } from "../components/ui";

export default function OrderSuccess() {
  const { state } = useLocation();
  const data: OrderCreateOut | undefined = (state as { data?: OrderCreateOut } | null)?.data;

  if (!data) {
    return (
      <div className="text-center">
        <p className="text-gray-600">Không có đơn hàng gần đây.</p>
        <Link to="/tim-kiem" className="mt-3 inline-block text-brand-lam underline">
          Về trang khám phá
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="text-6xl">🎉</div>
      <h1 className="mt-3 text-2xl font-bold text-ceramic-900">Đặt hàng thành công!</h1>
      <p className="mt-2 text-gray-600">
        Mã đơn: <span className="font-semibold">{data.order.code}</span>
      </p>

      <div className="mt-6 rounded-xl border border-ceramic-100 bg-white p-6">
        <h2 className="font-semibold text-ceramic-900">Thanh toán VietQR</h2>
        <p className="mt-1 text-sm text-gray-600">
          Quét mã bên dưới bằng app ngân hàng để thanh toán{" "}
          <Money value={data.order.total} className="font-bold text-brand-dat" />.
        </p>
        {data.qr_url ? (
          <img
            src={data.qr_url}
            alt="Mã QR thanh toán"
            className="mx-auto mt-4 h-56 w-56 rounded-lg border border-gray-200"
          />
        ) : (
          <div className="mx-auto mt-4 flex h-56 w-56 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-400">
            Không có mã QR
          </div>
        )}
        <p className="mt-3 text-xs text-gray-500">
          Đơn sẽ được chuẩn bị sau khi thanh toán được xác nhận.
        </p>
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <Link
          to={`/don-hang/${data.order.id}`}
          className="rounded-lg bg-brand-lam px-5 py-2.5 font-semibold text-white hover:bg-brand-lam/90"
        >
          Xem chi tiết đơn
        </Link>
        <Link to="/tim-kiem" className="rounded-lg bg-gray-100 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-200">
          Tiếp tục mua sắm
        </Link>
      </div>
    </div>
  );
}
