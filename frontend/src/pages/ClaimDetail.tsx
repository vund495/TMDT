import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { Badge, Panel, Spinner } from "../components/ui";
import { getDispute } from "../lib/api";

export default function ClaimDetail() {
  const { id = "" } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dispute", id],
    queryFn: () => getDispute(id),
    enabled: !!id,
  });

  if (isLoading) return <Spinner />;
  if (isError || !data)
    return <p className="text-red-600">Không tìm thấy khiếu nại.</p>;

  const d = data;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-6 w-6 text-men-700" />
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Khiếu nại</h1>
      </div>

      <Panel className="mt-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <span className="text-xs text-ink-faint">Đơn hàng</span>
            <p className="font-mono text-sm font-semibold text-ink">{d.order_id}</p>
          </div>
          <Badge tone={d.status === "resolved" ? "green" : d.status === "reviewing" ? "amber" : "blue"}>
            {d.status === "resolved" ? "Đã xử lý" : d.status === "reviewing" ? "Đang xem xét" : "Mở"}
          </Badge>
        </div>

        <div className="mt-4">
          <h3 className="label-sm text-ink-faint">Lý do khiếu nại</h3>
          <p className="mt-1 text-sm text-ink">{d.reason}</p>
        </div>

        {d.evidence_urls && d.evidence_urls.length > 0 && (
          <div className="mt-4">
            <h3 className="label-sm text-ink-faint">Ảnh minh chứng</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {d.evidence_urls.map((u, i) => (
                <a
                  key={i}
                  href={u}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-stone-200 px-3 py-2 text-xs text-men-700 hover:bg-cream-50"
                >
                  Ảnh #{i + 1}
                </a>
              ))}
            </div>
          </div>
        )}

        {d.resolution && (
          <div className="mt-5 rounded-xl bg-emerald-50 p-4">
            <span className="label-sm text-emerald-700">Kết quả xử lý</span>
            <p className="mt-1 text-sm text-emerald-900">{d.resolution}</p>
          </div>
        )}
      </Panel>

      <div className="mt-4">
        <Link to="/khieu-nai" className="text-sm font-semibold text-men-700 hover:underline">
          ← Về danh sách khiếu nại
        </Link>
      </div>
    </div>
  );
}
