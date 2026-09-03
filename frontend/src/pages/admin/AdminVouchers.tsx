import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Ticket } from "lucide-react";
import { EmptyState, Spinner } from "../../components/ui";
import { createVoucher, deleteVoucher, listVouchers, updateVoucher } from "../../lib/api";
import type { Voucher } from "../../types";

const emptyForm = { code: "", discount_percent: "", max_discount_amount: "", valid_from: "", valid_until: "", usage_limit: "" };

export default function AdminVouchers() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["admin-vouchers"], queryFn: listVouchers });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-vouchers"] });

  const create = useMutation({
    mutationFn: () =>
      createVoucher({
        code: form.code.toUpperCase(),
        discount_percent: Number(form.discount_percent),
        max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : undefined,
        valid_from: form.valid_from,
        valid_until: form.valid_until,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : undefined,
      }),
    onSuccess: () => {
      setShowForm(false);
      setForm(emptyForm);
      invalidate();
    },
  });

  const toggle = useMutation({
    mutationFn: (v: Voucher) => updateVoucher(v.code, { active: !v.active }),
    onSuccess: invalidate,
  });

  const del = useMutation({
    mutationFn: deleteVoucher,
    onSuccess: invalidate,
  });

  const set = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý voucher</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900">
          <Plus className="h-4 w-4" /> Tạo voucher
        </button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="text-red-600">Không tải được.</p>
        ) : !data || data.length === 0 ? (
          <EmptyState icon={<Ticket className="h-12 w-12" />} title="Chưa có voucher nào" />
        ) : (
          <div className="space-y-3">
            {data.map((v) => (
              <div key={v.code} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-brand-dat/10 px-2 py-0.5 font-mono font-bold text-brand-dat-700">{v.code}</span>
                    <span className={`text-sm ${v.active ? "text-green-600" : "text-gray-400"}`}>{v.active ? "Hoạt động" : "Tắt"}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    Giảm {v.discount_percent}% · dùng {v.used_count}/{v.usage_limit ?? "∞"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(v.valid_from).toLocaleDateString("vi-VN")} → {new Date(v.valid_until).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggle.mutate(v)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                    {v.active ? "Tắt" : "Bật"}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Xóa voucher ${v.code}?`)) del.mutate(v.code);
                    }}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    Xóa
                  </button>
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
              if (form.code && form.discount_percent && form.valid_from && form.valid_until) create.mutate();
            }}
            className="w-full max-w-md space-y-3 rounded-xl bg-white p-6"
          >
            <h2 className="font-bold text-gray-900">Tạo voucher mới</h2>
            <input value={form.code} onChange={set("code")} placeholder="Mã (VD: GIAM10) *" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase" />
            <div className="grid grid-cols-2 gap-3">
              <input value={form.discount_percent} onChange={set("discount_percent")} type="number" placeholder="% giảm *" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <input value={form.max_discount_amount} onChange={set("max_discount_amount")} type="number" placeholder="Giảm tối đa (₫)" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <input value={form.valid_from} onChange={set("valid_from")} type="date" placeholder="Từ" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <input value={form.valid_until} onChange={set("valid_until")} type="date" placeholder="Đến" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <input value={form.usage_limit} onChange={set("usage_limit")} type="number" placeholder="Số lượt dùng" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">Hủy</button>
              <button type="submit" disabled={create.isPending} className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {create.isPending ? "Đang tạo..." : "Tạo"}
              </button>
            </div>
            {create.isError && <p className="text-sm text-red-600">{(create.error as Error).message}</p>}
          </form>
        </div>
      )}
    </div>
  );
}
