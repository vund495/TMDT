const POLICIES = [
  {
    title: "Giao hàng & vận chuyển",
    color: "from-men-700 to-men-900",
    items: [
      "Đơn hàng được xử lý và đóng gói trong vòng 24-48h sau khi thanh toán thành công.",
      "Miễn phí vận chuyển cho đơn từ 1.000.000₫ trong nội thành Hà Nội; các khu vực khác tính phí theo từng đối tác vận chuyển (GHTK, J&T, Viettel Post...).",
      "Thời gian giao hàng dự kiến 2-5 ngày làm việc trong nước.",
      "Quý khách có thể theo dõi trạng thái lộ trình đơn hàng trong mục “Đơn hàng của tôi”.",
    ],
  },
  {
    title: "Chính sách đổi trả - Vỡ 1 đền 1",
    color: "from-dat-700 to-dat-900",
    items: [
      "Sản phẩm gốm sứ được bảo vệ bằng đóng gói chống sốc chuyên dụng đa lớp đạt tiêu chuẩn.",
      "Nếu sản phẩm bị nứt, vỡ do vận chuyển khi nhận hàng, quý khách tạo yêu cầu đền bù trong mục “Khiếu nại” kèm ảnh/video bằng chứng.",
      "Theo cam kết nền tảng, chúng tôi không yêu cầu khách giải trình phức tạp.",
      "Quý khách được chọn một trong hai hình thức: Hoàn tiền 100% hoặc gửi sản phẩm thay thế mới.",
    ],
  },
  {
    title: "Bảo hành",
    color: "from-green-700 to-green-900",
    items: [
      "Sản phẩm gốm sứ được bảo hành chất lượng trong 12 tháng cho các lỗi kỹ thuật do nhà sản xuất (men không đạt, nứt khi nung...).",
      "Mỗi sản phẩm đi kèm “Hộ chiếu sản phẩm” QR - minh bạch nguồn gốc, chất liệu và quy trình nung/men.",
      "Bảo hành không áp dụng cho hư hại do va đập, rơi vỡ trong quá trình sử dụng.",
    ],
  },
  {
    title: "Hoàn tiền & thanh toán",
    color: "from-lam-700 to-lam-900",
    items: [
      "Thanh toán trực tuyến qua VietQR/Casso, đối soát tự động và an toàn.",
      "Hoàn tiền được xử lý trong 3-7 ngày làm việc kể từ khi khiếu nại được phê duyệt, chuyển về tài khoản/ngân hàng của khách.",
      "Mọi giao dịch được ghi nhận minh bạch trên hệ thống.", 
    ],
  },
];

export default function PolicyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-ceramic-900">Chính sách</h1>
      <p className="mt-1 text-sm text-gray-600">
        Cam kết của VietCraft Bát Tràng với khách hàng: minh bạch, đền bù xứng đáng, giao nhận an toàn.
      </p>

      <div className="mt-6 space-y-5">
        {POLICIES.map((p) => (
          <div key={p.title} className="overflow-hidden rounded-2xl border border-ceramic-100 bg-white">
            <div className={`bg-gradient-to-r ${p.color} px-5 py-3`}>
              <h2 className="font-bold text-white">{p.title}</h2>
            </div>
            <ul className="space-y-2 p-5 text-sm text-gray-700">
              {p.items.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-0.5 text-brand-lam">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
