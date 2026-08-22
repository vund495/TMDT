import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api.js";

function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => apiFetch("/health"),
    retry: false,
  });
}

export default function CustomerHome() {
  const { data, isError } = useHealth();

  return (
    <div>
      <h1 className="text-3xl font-bold text-ceramic-900">Gốm sứ Bát Tràng</h1>
      <p className="mt-2 text-ceramic-700">
        Sàn TMĐT gốm truyền thống — Hộ chiếu sản phẩm · Tour trải nghiệm · Vỡ
        1 đền 1
      </p>

      <div className="mt-8 rounded-xl border border-ceramic-100 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-ceramic-900">Kết nối backend</h2>
        <p className="mt-1 text-sm text-gray-600">
          {isError
            ? "Chưa kết nối được API — hãy chạy uvicorn."
            : `Trạng thái API: ${data?.status ?? "đang kiểm tra..."}`}
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {["Lọc & tìm kiếm", "Giỏ hàng & VietQR", "Đánh giá & bình luận"].map(
          (f) => (
            <div
              key={f}
              className="rounded-lg border border-ceramic-100 bg-white p-4 text-sm font-medium text-ceramic-700 shadow-sm"
            >
              {f}
            </div>
          )
        )}
      </div>
    </div>
  );
}
