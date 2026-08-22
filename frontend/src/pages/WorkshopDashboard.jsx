export default function WorkshopDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-ceramic-900">Quản lý xưởng gốm</h1>
      <p className="mt-2 text-ceramic-700">
        Đăng sản phẩm · Quản lý đơn hàng · Lịch tour · Báo cáo doanh thu
      </p>
      <div className="mt-8 rounded-xl border border-ceramic-100 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-ceramic-900">Sắp ra mắt</h2>
        <p className="mt-1 text-sm text-gray-600">
          Khu vực dành cho chủ xưởng (yêu cầu đăng nhập vai trò workshop_owner).
        </p>
      </div>
    </div>
  );
}
