import { Link } from "react-router-dom";
import { Ticket } from "lucide-react";

export default function VouchersPage() {
  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center gap-2">
        <Ticket className="h-6 w-6 text-brand-dat" />
        <h1 className="text-2xl font-bold text-ceramic-900">Ưu đãi & voucher</h1>
      </div>

      <div className="mt-6 rounded-xl border border-ceramic-100 bg-white p-6">
        <h2 className="font-semibold text-ceramic-900">Chương trình ưu đãi</h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-700">
          <li>🎫 <b>Mã giảm giá (Voucher)</b> — nhập mã khi thanh toán để giảm % giá trị đơn.</li>
          <li>🏺 <b>Tham dự tour làm gốm</b> — xác nhận tham dự để nhận voucher giảm giá sản phẩm của xưởng.</li>
          <li>🪪 <b>Hộ chiếu sản phẩm</b> — mua hàng và xác nhận nhận hàng để mở khóa câu chuyện nghệ nhân.</li>
        </ul>

        <div className="mt-5 rounded-lg border border-dashed border-brand-lam/40 bg-brand-lam/5 p-4 text-sm">
          <p className="font-medium text-brand-lam">Cách dùng voucher</p>
          <p className="mt-1 text-gray-600">
            Thêm sản phẩm vào giỏ → tiến hành thanh toán → nhập mã giảm giá ở mục "Mã giảm giá" rồi áp dụng.
          </p>
        </div>

        <Link
          to="/tim-kiem"
          className="mt-5 inline-block rounded-lg bg-brand-lam px-5 py-2.5 font-semibold text-white hover:bg-brand-lam/90"
        >
          Đi mua sắm để áp dụng
        </Link>
      </div>
    </div>
  );
}
