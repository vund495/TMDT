import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Package, Plus, QrCode, Trash2, X } from "lucide-react";
import { EmptyState, Money, Spinner, StatusBadge } from "../../components/ui";
import { createProduct, deleteProduct, listMyProducts, publishProduct, updateProduct, uploadFile } from "../../lib/api";
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
  const [page, setPage] = useState(1);
  const products = useQuery({
    queryKey: ["my-products", page],
    queryFn: () => listMyProducts({ page, page_size: 20 }),
  });
  const totalPages = Math.max(1, products.data?.total_pages ?? 1);

  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [qrFor, setQrFor] = useState<Product | null>(null);
  const [copied, setCopied] = useState(false);
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

  const [deleting, setDeleting] = useState<Product | null>(null);
  const remove = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
    },
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
        <button onClick={openNew} className="flex items-center gap-1 rounded-lg bg-dat-700 px-4 py-2 text-sm font-semibold text-white hover:bg-dat-800">
          <Plus className="h-4 w-4" /> Thêm sản phẩm
        </button>
      </div>

      <div className="mt-6">
        {products.isLoading ? (
          <Spinner />
        ) : !products.data || products.data.items.length === 0 ? (
          <EmptyState title="Chưa có sản phẩm nào" hint="Thêm sản phẩm đầu tiên để bắt đầu kinh doanh." />
        ) : (
          <>
          <div className="space-y-3">
            {products.data.items.map((p) => (
              <div key={p.id} className="flex items-center gap-4 rounded-xl border border-ceramic-100 bg-white p-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cream-100">
                  {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" /> : <Package className="h-6 w-6 text-ink-faint" aria-hidden />}
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
                  {p.passport_qr && (
                    <button
                      onClick={() => {
                        setQrFor(p);
                        setCopied(false);
                      }}
                      className="flex items-center gap-1 rounded-md border border-brand-lam/40 px-3 py-1.5 text-sm text-brand-lam hover:bg-brand-lam/10"
                      title="Hộ chiếu sản phẩm QR"
                    >
                      <QrCode className="h-4 w-4" /> QR
                    </button>
                  )}
                  <button
                    onClick={() => setDeleting(p)}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {(p.status === "draft" || p.status === "rejected" || p.status === "pending_review") && (
                    <button
                      onClick={() => publish.mutate(p.id)}
                      disabled={publish.isPending}
                      className="rounded-md bg-dat-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-dat-800 disabled:opacity-50"
                    >
                      Gửi duyệt
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || products.isFetching}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              ← Trước
            </button>
            <span className="px-2 text-gray-600">
              Trang {page} / {totalPages} - {(products.data?.total ?? 0).toLocaleString("vi-VN")} sản phẩm
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || products.isFetching}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Sau →
            </button>
          </div>
          </>
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
              <button type="submit" disabled={save.isPending} className="rounded-md bg-dat-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {save.isPending ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
            {save.isError && <p className="text-sm text-red-600">{(save.error as Error).message}</p>}
          </form>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleting(null)}>
          <div onClick={(e) => e.stopPropagation()} className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-ceramic-900">Xóa sản phẩm?</h2>
            <p className="mt-2 text-sm text-gray-600">
              Bạn có chắc muốn xóa <b>{deleting.name}</b>? Hành động này không thể hoàn tác.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setDeleting(null)} className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
                Hủy
              </button>
              <button
                onClick={() => remove.mutate(deleting.id)}
                disabled={remove.isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {remove.isPending ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
            {remove.isError && <p className="mt-2 text-sm text-red-600">{(remove.error as Error).message}</p>}
          </div>
        </div>
      )}

      {qrFor?.passport_qr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setQrFor(null)}>
          <div onClick={(e) => e.stopPropagation()} className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ceramic-900">Hộ chiếu sản phẩm</h2>
              <button onClick={() => setQrFor(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-600">{qrFor.name}</p>

            <div className="mt-4 rounded-lg border-2 border-dashed border-brand-lam/40 bg-brand-lam/5 p-4">
              <p className="text-center font-mono text-xl font-bold tracking-widest text-brand-lam">
                {qrFor.passport_qr}
              </p>
              <p className="mt-1 text-center text-xs text-gray-500">
                Cho khách quét mã này tại trang tra cứu để xem nguồn gốc sản phẩm.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(qrFor.passport_qr ?? "");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="rounded-md bg-dat-700 px-4 py-2 text-sm font-semibold text-white hover:bg-dat-800"
              >
                {copied ? "Đã copy" : "Copy mã"}
              </button>
              <a
                href={`http://localhost:5173/ho-chieu?code=${encodeURIComponent(qrFor.passport_qr)}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-brand-lam px-4 py-2 text-center text-sm font-semibold text-brand-lam hover:bg-brand-lam/10"
              >
                Xem thử
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
