import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Camera, ImagePlus } from "lucide-react";
import { Button, Field, Panel, Spinner, toastOk, toastError } from "../components/ui";
import { createDispute, listOrders } from "../lib/api";

export default function ClaimNew() {
  const navigate = useNavigate();
  const orders = useQuery({ queryKey: ["orders"], queryFn: listOrders });

  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");

  const eligible = (orders.data ?? []).filter(
    (o) => o.status === "completed" || o.status === "disputing"
  );

  const create = useMutation({
    mutationFn: () => createDispute({ order_id: orderId, reason, evidence_urls: evidence }),
    onSuccess: (d) => {
      toastOk("Đã gửi khiếu nại", "Chúng tôi sẽ xử lý trong thời gian sớm nhất.");
      navigate(`/khieu-nai/${d.id}`);
    },
    onError: (e) => toastError("Gửi khiếu nại thất bại", (e as Error).message),
  });

  const addUrl = () => {
    if (urlInput.trim()) {
      setEvidence((s) => [...s, urlInput.trim()]);
      setUrlInput("");
    }
  };

  if (orders.isLoading) return <Spinner />;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Tạo yêu cầu đền bù</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Chọn đơn hàng đủ điều kiện và mô tả tình trạng vỡ/hư hỏng khi nhận.
      </p>

      <Panel className="mt-6">
        <div className="space-y-4">
          <Field
            label="Đơn hàng đủ điều kiện"
            required
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Chọn đơn hàng đã nhận..."
          />
          {eligible.length === 0 && (
            <p className="text-xs text-ink-faint">
              Chưa có đơn hàng nào đủ điều kiện (cần đơn đã hoàn thành).{" "}
              <Link to="/don-hang" className="text-men-700 underline">
                Xem đơn hàng
              </Link>
            </p>
          )}

          <Field
            label="Ảnh minh chứng (URL)"
            hint="Dán URL ảnh chụp sản phẩm vỡ, phân tách bằng nút thêm"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-men-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
              Ảnh minh chứng ({evidence.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {evidence.map((u, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 rounded-lg bg-cream-100 px-3 py-1.5 text-xs text-ink"
              >
                <ImagePlus className="h-3.5 w-3.5 text-men-600" />
                #{i + 1}
              </span>
            ))}
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={addUrl}>
            <ImagePlus className="h-4 w-4" /> Thêm ảnh
          </Button>

          <label className="block">
            <span className="mb-1 flex items-center gap-1 text-sm font-semibold text-ink">
              Mô tả tình trạng thùng & sản phẩm <span className="text-red-500">*</span>
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Sản phẩm bị vỡ vụn khi mở hộp, thùng bị móp méo..."
              rows={4}
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-men-400 focus:outline-none focus:ring-2 focus:ring-men-100"
            />
          </label>

          <Button
            block
            disabled={create.isPending || !orderId || !reason}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Đang gửi..." : "Gửi yêu cầu đền bù"}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
