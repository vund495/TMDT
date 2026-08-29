export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-ceramic-900">Trang quản trị</h1>
      <p className="mt-2 text-ceramic-700">
        Duyệt xưởng · Kiểm duyệt nội dung · Phân xử khiếu nại · Đối soát
      </p>
      <div className="mt-8 rounded-xl border border-ceramic-100 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-ceramic-900">Sắp ra mắt</h2>
        <p className="mt-1 text-sm text-gray-600">
          Khu vực dành cho quản trị viên (yêu cầu đăng nhập vai trò admin).
        </p>
      </div>
    </div>
  );
}
