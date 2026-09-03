import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Plus, X } from "lucide-react";
import { EmptyState, Money, Spinner, StatusBadge } from "../../components/ui";
import { createProduct, listMyProducts, publishProduct, updateProduct, uploadFile } from "../../lib/api";
import type { Product } from "../../types";

const emptyForm = {
  name: "",
  description: "",
  theme: "",
  material: "",
  firing_technique: "",
  glaze: "",
  original_price: "",
  sale_price: "",
  stock: "10",
  images: "",
  video_url: "",
};

export default function WorkshopProducts() {
  const qc = useQueryClient();
  const products = useQuery({ queryKey: ["my-products"], queryFn: () => listMyProducts({ page_size: 100 }) });

  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const fileRef = useRef<HTMLInputElement>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["my-products"] });

  const upload = useMutation({
    mutationFn: (file: File) => uploadFile(file),
    onSuccess: (r) => {
      const urls = form.images ? form.images.split(",").map((s) => s.trim()).filter(Boolean) : [];
      urls.push(r.url);
      setForm((f) => ({ ...f, images: urls.join(",") }));
      if (fileRef.current) fileRef.current.value = "";
    },
  });

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name,
        description: form.description || undefined,
        theme: form.theme || undefined,
        material: form.material || undefined,
        firing_technique: form.firing_technique || undefined,
        glaze: form.glaze || undefined,
        original_price: Number(form.original_price),
        sale_price: form.sale_price ? Number(form.sale_price) : undefined,
        stock: form.stock ? Number(form.stock) : undefined,
        images: form.images ? form.images.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        video_url: form.video_url || undefined,
      };
      return editing ? updateProduct(editing.id, body) : createProduct(body);
    },
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
    },
  });

  const publish = useMutation({
    mutationFn: publishProduct,
    onSuccess: invalidate,
  });

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description ?? "",
      theme: p.theme ?? "",
      material: p.material ?? "",
      firing_technique: p.firing_technique ?? "",
      glaze: p.glaze ?? "",
      original_price: String(p.original_price),
      sale_price: p.sale_price != null ? String(p.sale_price) : "",
      stock: String(p.stock),
      images: (p.images ?? []).join(", "),
      video_url: p.video_url ?? "",
    });
    setShowForm(true);
  };

  const set = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ceramic-900">Sản phẩm của tôi</h1>
        <button onClick={openNew} className="flex items-center gap-1 rounded-lg bg-brand-dat px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dat-700">
          <Plus className="h-4 w-4" /> Thêm sản phẩm
        </button>
      </div>

      <div className="mt-6">
        {products.isLoading ? (
          <Spinner />
        ) : !products.data || products.data.items.length === 0 ? (
          <EmptyState title="Chưa có sản phẩm nào" hint="Thêm sản phẩm đầu tiên để bắt đầu kinh doanh." />
        ) : (
          <div className="space-y-3">
            {products.data.items.map((p) => (
              <div key={p.id} className="flex items-center gap-4 rounded-xl border border-ceramic-100 bg-white p-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                  {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" /> : "🏺"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-ceramic-900">{p.name}</h3>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    <Money value={p.sale_price ?? p.original_price} />
                    <span className="ml-3 text-gray-400">Kho: {p.stock}</span>
                    <span className="ml-3 text-gray-400">Đã bán: {p.sold_count}</span>
                  </div>
                  {p.reject_reason && (
                    <p className="mt-1 text-xs text-red-600">Lý do từ chối: {p.reject_reason}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => openEdit(p)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                    Sửa
                  </button>
                  {(p.status === "draft" || p.status === "rejected" || p.status === "pending_review") && (
                    <button
                      onClick={() => publish.mutate(p.id)}
                      disabled={publish.isPending}
                      className="rounded-md bg-brand-lam px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-lam/90 disabled:opacity-50"
                    >
                      Gửi duyệt
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              if (form.name && form.original_price) save.mutate();
            }}
            className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-auto rounded-xl bg-white p-6"
          >
            <h2 className="text-lg font-bold text-ceramic-900">{editing ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</h2>
            <input value={form.name} onChange={set("name")} placeholder="Tên sản phẩm *" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <textarea value={form.description} onChange={set("description")} placeholder="Mô tả" className="w-full rounded-md border border-gray-300 p-3 text-sm" rows={2} />
            <div className="grid grid-cols-2 gap-3">
              <input value={form.theme} onChange={set("theme")} placeholder="Chủ đề" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <input value={form.material} onChange={set("material")} placeholder="Chất liệu" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <input value={form.firing_technique} onChange={set("firing_technique")} placeholder="Kỹ thuật nung" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <input value={form.glaze} onChange={set("glaze")} placeholder="Men" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <input value={form.original_price} onChange={set("original_price")} type="number" placeholder="Giá gốc (VNĐ) *" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <input value={form.sale_price} onChange={set("sale_price")} type="number" placeholder="Giá khuyến mãi" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <input value={form.stock} onChange={set("stock")} type="number" placeholder="Tồn kho" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <input value={form.video_url} onChange={set("video_url")} placeholder="Video URL" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <input value={form.images} onChange={set("images")} placeholder="Ảnh URL (phân tách dấu phẩy)" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <div>
              <div className="flex flex-wrap gap-2">
                {(form.images ? form.images.split(",").map((s) => s.trim()).filter(Boolean) : []).map((url, i) => (
                  <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        const list = form.images.split(",").map((s) => s.trim()).filter(Boolean);
                        list.splice(i, 1);
                        setForm((f) => ({ ...f, images: list.join(",") }));
                      }}
                      className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-[10px] text-white"
                    >
                      <X />
                    </button>
                  </div>
                ))}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  files.forEach((f) => upload.mutate(f));
                }}
                className="hidden"
              />
              <button
                type="button"
                disabled={upload.isPending}
                onClick={() => fileRef.current?.click()}
                className="mt-2 inline-flex items-center gap-2 rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-brand-lam hover:text-brand-lam disabled:opacity-50"
              >
                <ImagePlus className="h-4 w-4" />
                {upload.isPending ? "Đang tải ảnh..." : "Tải ảnh lên"}
              </button>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
                Hủy
              </button>
              <button type="submit" disabled={save.isPending} className="rounded-md bg-brand-dat px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {save.isPending ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
            {save.isError && <p className="text-sm text-red-600">{(save.error as Error).message}</p>}
          </form>
        </div>
      )}
    </div>
  );
}
