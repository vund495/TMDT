import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Amphora, ScanLine, Ticket } from "lucide-react";
import { myVouchers } from "../lib/api";
import { Money, Spinner } from "../components/ui";

export default function VouchersPage() {
  const vouchers = useQuery({ queryKey: ["my-vouchers"], queryFn: myVouchers });

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center gap-2">
        <Ticket className="h-6 w-6 text-dat-700" />
        <h1 className="text-2xl font-bold text-ceramic-900">Ưu đãi & voucher</h1>
      </div>

      <div className="mt-6 rounded-xl border border-ceramic-100 bg-white p-6">
        <h2 className="font-semibold text-ceramic-900">Voucher của tôi</h2>
        {vouchers.isLoading ? (
          <Spinner />
        ) : vouchers.isError ? (
          <p className="mt-3 text-sm text-red-600">Không tải được danh sách voucher.</p>
        ) : !vouchers.data || vouchers.data.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            Bạn chưa có voucher nào. Tham dự tour làm gốm hoặc mua hàng để nhận voucher!
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {vouchers.data.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-lg border border-brand-lam/30 bg-brand-lam/5 p-4"
              >
                <div>
                  <div className="font-mono text-lg font-bold text-brand-lam">{v.code}</div>
                  <div className="text-sm text-gray-600">
                    Giảm {v.discount_percent}%
                    {v.max_discount_amount ? ` (tối đa ` : ""}
                    {v.max_discount_amount ? <Money value={v.max_discount_amount} className="inline" /> : null}
                    {v.max_discount_amount ? `)` : ""}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    HSD: {new Date(v.valid_until).toLocaleDateString("vi-VN")}
                  </div>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${v.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {v.active ? "Còn hiệu lực" : "Hết hạn"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 rounded-xl border border-ceramic-100 bg-white p-6">
        <h2 className="font-semibold text-ceramic-900">Cách nhận & sử dụng voucher</h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-700">
          <li className="flex gap-2"><Ticket className="mt-0.5 h-4 w-4 shrink-0 text-dat-700" aria-hidden /> <span><b>Mã giảm giá (Voucher)</b> - nhập mã khi thanh toán để giảm % giá trị đơn.</span></li>
          <li className="flex gap-2"><Amphora className="mt-0.5 h-4 w-4 shrink-0 text-dat-700" aria-hidden /> <span><b>Tham dự tour làm gốm</b> - xác nhận tham dự để nhận voucher giảm giá sản phẩm của xưởng.</span></li>
          <li className="flex gap-2"><ScanLine className="mt-0.5 h-4 w-4 shrink-0 text-dat-700" aria-hidden /> <span><b>Hộ chiếu sản phẩm</b> - mua hàng và xác nhận nhận hàng để mở khóa câu chuyện nghệ nhân.</span></li>
        </ul>

        <div className="mt-5 rounded-lg border border-dashed border-brand-lam/40 bg-brand-lam/5 p-4 text-sm">
          <p className="font-medium text-brand-lam">Cách dùng voucher</p>
          <p className="mt-1 text-gray-600">
            Thêm sản phẩm vào giỏ → tiến hành thanh toán → nhập mã giảm giá ở mục "Mã giảm giá" rồi áp dụng.
          </p>
        </div>

        <Link
          to="/tim-kiem"
          className="mt-5 inline-block rounded-lg bg-dat-700 px-5 py-2.5 font-semibold text-white hover:bg-dat-800"
        >
          Đi mua sắm để áp dụng
        </Link>
      </div>
    </div>
  );
}
