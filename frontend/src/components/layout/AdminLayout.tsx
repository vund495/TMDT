import WorkspaceLayout from "./WorkspaceLayout";

export default function AdminLayout() {
  return (
    <WorkspaceLayout
      accent="from-men-800 to-men-900"
      gradient="from-[#16284f] to-[#0e1a36]"
      eyebrow="Khu quản trị"
      title="VietCraft Admin"
      logoutLabel="Đăng xuất admin"
      nav={[
        {
          title: "Quản lý",
          items: [
            { label: "Tổng quan", to: "/admin" },
            { label: "Xưởng chờ duyệt", to: "/admin/xuong" },
            { label: "Sản phẩm chờ duyệt", to: "/admin/san-pham" },
            { label: "Người dùng", to: "/admin/nguoi-dung" },
            { label: "Khiếu nại", to: "/admin/khieu-nai" },
            { label: "Đặt tour", to: "/admin/tour" },
            { label: "Đối soát doanh thu", to: "/admin/doi-soat" },
            { label: "Liên hệ & góp ý", to: "/admin/lien-he" },
          ],
        },
      ]}
    />
  );
}
