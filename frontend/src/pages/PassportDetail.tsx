import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Lock, Play, QrCode } from "lucide-react";
import { Badge, Panel, Spinner } from "../components/ui";
import { getPassport } from "../lib/api";

export default function PassportDetail() {
  const { code = "" } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["passport", code],
    queryFn: () => getPassport(code),
    enabled: !!code,
  });

  if (isLoading) return <Spinner />;
  if (isError || !data)
    return <p className="text-red-600">Không tra cứu được hộ chiếu.</p>;
  if (!data.found)
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="text-red-600">{data.message}</p>
        <Link to="/ho-chieu" className="mt-3 inline-block text-men-700 underline">
          Quét mã khác
        </Link>
      </div>
    );

  const specs = [
    { label: "Chất liệu", value: data.material },
    { label: "Kỹ thuật nung", value: data.firing_technique },
    { label: "Men", value: data.glaze },
    { label: "Chủ đề", value: data.theme },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-2">
        <QrCode className="h-6 w-6 text-men-700" />
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Hộ chiếu sản phẩm</h1>
      </div>
      <p className="mt-1 font-mono text-xs text-ink-faint">{code}</p>

      <Panel className="mt-6" title={data.product_name} description="Truy xuất nguồn gốc & câu chuyện nghệ nhân">
        <div className="mb-4 flex items-center gap-2">
          {data.unlocked ? (
            <Badge tone="green">Đã xác thực & mở khóa</Badge>
          ) : (
            <Badge tone="slate">Đang khóa</Badge>
          )}
        </div>

        <div className="grid gap-2 text-sm sm:grid-cols-2">
          {specs.map((s) => (
            <div key={s.label} className="rounded-lg bg-cream-50 px-3 py-2">
              <div className="text-xs text-ink-faint">{s.label}</div>
              <div className="font-semibold text-ink">{s.value || "—"}</div>
            </div>
          ))}
        </div>

        {/* Trạng thái xác thực */}
        <div className="mt-5 rounded-xl border border-stone-100 p-4">
          <div className="flex items-center gap-2">
            {data.unlocked ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <Lock className="h-5 w-5 text-stone-400" />
            )}
            <p className="text-sm font-bold text-ink">
              {data.unlocked ? "Hộ chiếu đã mở khóa" : "Hộ chiếu chưa mở khóa"}
            </p>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            {data.unlocked
              ? "Bạn là chủ sở hữu sản phẩm này. Câu chuyện và video nghệ nhân đã được mở."
              : "Mua sản phẩm và xác nhận nhận hàng để mở khóa video & câu chuyện nghệ nhân."}
          </p>
          {data.unlocked && data.video_url && (
            <a
              href={data.video_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-men-700 px-4 py-2 text-sm font-semibold text-white hover:bg-men-800"
            >
              <Play className="h-4 w-4" /> Xem video nghệ nhân
            </a>
          )}
        </div>
      </Panel>
    </div>
  );
}
