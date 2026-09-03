import WorkspaceLayout from "./WorkspaceLayout";

export default function WorkshopLayout() {
  return (
    <WorkspaceLayout
      accent="from-dat-800 to-dat-900"
      gradient="from-[#7c4a1d] to-[#4a2c10]"
      eyebrow="Khu chủ xưởng"
      title="Xưởng Gốm"
      logoutLabel="Đăng xuất xưởng"
      nav={[
        {
          title: "Cửa hàng",
          items: [
            { label: "Tổng quan", to: "/xuong" },
            { label: "Hồ sơ xưởng", to: "/xuong/hs" },
            { label: "Sản phẩm", to: "/xuong/san-pham" },
            { label: "Đơn hàng", to: "/xuong/don-hang" },
          ],
        },
        {
          title: "Trải nghiệm",
          items: [
            { label: "Lịch tour", to: "/xuong/tour" },
            { label: "Doanh thu", to: "/xuong/doanh-thu" },
            { label: "Ví đối soát", to: "/xuong/vi-doi-soat" },
          ],
        },
      ]}
    />
  );
}
