import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { QrCode, Lock, Play } from "lucide-react";
import { Spinner, StatusBadge } from "../components/ui";
import { getPassport } from "../lib/api";

export default function PassportPage() {
  const [sp, setSp] = useSearchParams();
  const [code, setCode] = useState(sp.get("code") ?? "");
  const active = sp.get("code") ?? "";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["passport", active],
    queryFn: () => getPassport(active),
    enabled: !!active,
  });

  const lookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (code) setSp({ code: code.trim() });
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center gap-2">
        <QrCode className="h-6 w-6 text-brand-lam" />
        <h1 className="text-2xl font-bold text-ceramic-900">Hộ chiếu sản phẩm</h1>
      </div>
      <p className="mt-1 text-sm text-gray-600">
        Quét mã QR trên sản phẩm để tra cứu nguồn gốc và câu chuyện nghệ nhân.
      </p>

      <form onSubmit={lookup} className="mt-5 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Nhập mã QR trên sản phẩm..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button className="rounded-md bg-dat-700 px-5 py-2 text-sm font-semibold text-white hover:bg-dat-800">
          Tra cứu
        </button>
      </form>

      <div className="mt-6">
        {!active ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
            Nhập mã QR để bắt đầu tra cứu.
          </p>
        ) : isLoading ? (
          <Spinner />
        ) : isError || !data ? (
          <p className="text-red-600">Lỗi khi tra cứu hộ chiếu.</p>
        ) : !data.found ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {data.message}
          </p>
        ) : (
          <div className="rounded-xl border border-ceramic-100 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ceramic-900">{data.product_name}</h2>
              <StatusBadge status={data.unlocked ? "active" : "pending"} />
            </div>

            <div className="mt-4 grid gap-2 text-sm">
              {[
                ["Chất liệu", data.material],
                ["Kỹ thuật nung", data.firing_technique],
                ["Men", data.glaze],
                ["Chủ đề", data.theme],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-gray-100 py-1">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium text-ceramic-900">{v || "-"}</span>
                </div>
              ))}
            </div>

            <div className="mt-4">
              {data.unlocked ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                    <Play className="h-4 w-4" /> Hộ chiếu đã mở khóa - bạn là chủ sở hữu
                  </div>
                  {data.video_url ? (
                    <p className="mt-2 text-sm text-gray-700">
                      Video nghệ nhân:{" "}
                      <a href={data.video_url} target="_blank" rel="noreferrer" className="text-brand-lam underline">
                        Xem ngay
                      </a>
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-gray-600">Video nghệ nhân sẽ có sớm.</p>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                  <div className="flex items-center gap-2 font-semibold">
                    <Lock className="h-4 w-4" /> Hộ chiếu đang khóa
                  </div>
                  <p className="mt-1 text-amber-700/80">
                    Mua sản phẩm và xác nhận nhận hàng để mở khóa video & câu chuyện nghệ nhân.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
