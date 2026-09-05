import { Link, useSearchParams } from "react-router-dom";

export default function VnpayResult() {
  const [sp] = useSearchParams();
  const status = sp.get("vnp_status");
  const type = sp.get("vnp_type") === "tour" ? "tour" : "order";
  const ref = sp.get("vnp_ref") ?? "";
  const rsp = sp.get("vnp_rsp") ?? "";

  const ok = status === "success";

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className={ok ? "text-6xl" : "text-6xl"}>{ok ? "✅" : "❌"}</div>
      <h1 className="mt-3 text-2xl font-bold text-ceramic-900">
        {ok ? "Thanh toán VNPay thành công!" : "Thanh toán VNPay chưa hoàn tất"}
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        {ok
          ? "Cổng VNPay đã xác nhận giao dịch. Voucher và hộ chiếu sản phẩm sẽ được mở khóa ngay."
          : "Giao dịch không thành công hoặc đã bị hủy. Bạn có thể thanh toán lại từ đơn hàng."}
      </p>
      {rsp && (
        <p className="mt-2 inline-block rounded-md bg-gray-100 px-3 py-1 text-xs text-gray-500">
          Mã phản hồi VNPay: {rsp}
        </p>
      )}

      <div className="mt-6 flex justify-center gap-3">
        {ok && (
          <Link
            to={type === "tour" ? "/tour-cua-toi" : `/don-hang/${ref}`}
            className="rounded-lg bg-brand-lam px-5 py-2.5 font-semibold text-white hover:bg-brand-lam/90"
          >
            {type === "tour" ? "Xem tour của tôi" : "Xem chi tiết đơn"}
          </Link>
        )}
        {!ok && (
          <Link
            to="/tim-kiem"
            className="rounded-lg bg-brand-lam px-5 py-2.5 font-semibold text-white hover:bg-brand-lam/90"
          >
            Tiếp tục mua sắm
          </Link>
        )}
        <Link
          to="/tim-kiem"
          className="rounded-lg bg-gray-100 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-200"
        >
          Về trang khám phá
        </Link>
      </div>
    </div>
  );
}