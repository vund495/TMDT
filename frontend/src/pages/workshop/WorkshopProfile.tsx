import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Spinner, StatusBadge } from "../../components/ui";
import { createWorkshop, getMyWorkshop, updateWorkshop } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

export default function WorkshopProfile() {
  const qc = useQueryClient();
  const { profile } = useAuthStore();

  const workshop = useQuery({ queryKey: ["my-workshop"], queryFn: getMyWorkshop, retry: false });
  const existing = workshop.data;

  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [address, setAddress] = useState(existing?.address ?? "");
  const [logoUrl, setLogoUrl] = useState(existing?.logo_url ?? "");

  useEffect(() => {
    if (existing) {
      setName(existing.name ?? "");
      setDescription(existing.description ?? "");
      setAddress(existing.address ?? "");
      setLogoUrl(existing.logo_url ?? "");
    }
  }, [existing]);

  const save = useMutation({
    mutationFn: () => {
      const body = { name, description: description || undefined, address: address || undefined, logo_url: logoUrl || undefined };
      return existing ? updateWorkshop(body) : createWorkshop(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-workshop"] });
    },
  });

  if (workshop.isLoading) return <Spinner />;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-ceramic-900">{existing ? "Hồ sơ xưởng gốm" : "Tạo xưởng gốm"}</h1>
      {existing && (
        <div className="mt-1 flex items-center gap-2">
          <StatusBadge status={existing.status} />
          {existing.reject_reason && (
            <span className="text-xs text-red-600">Lý do từ chối: {existing.reject_reason}</span>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name) save.mutate();
        }}
        className="mt-6 space-y-4 rounded-xl border border-ceramic-100 bg-white p-6"
      >
        <label className="block text-sm">
          <span className="text-gray-600">Tên xưởng *</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="VD: Gốm sứ Bát Tràng - Xưởng Hoàng Gia"
          />
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">Mô tả / câu chuyện</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 p-3"
            rows={4}
          />
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">Địa chỉ</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="VD: Bát Tràng, Gia Lâm, Hà Nội"
          />
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">Logo (URL)</span>
          <input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </label>

        {!existing && (
          <p className="text-xs text-gray-500">
            Sau khi gửi, admin sẽ xét duyệt hồ sơ xưởng của bạn. Người quản trị: {profile?.email}
          </p>
        )}

        <button
          type="submit"
          disabled={save.isPending || !name}
          className="w-full rounded-lg bg-dat-700 px-5 py-2.5 font-semibold text-white hover:bg-dat-800 disabled:opacity-50"
        >
          {save.isPending ? "Đang lưu..." : existing ? "Cập nhật hồ sơ" : "Gửi duyệt xưởng"}
        </button>
        {save.isSuccess && (
          <p className="text-center text-sm text-green-600">Đã lưu. {existing && existing.status === "pending" ? "Chờ admin duyệt." : ""}</p>
        )}
        {save.isError && <p className="text-center text-sm text-red-600">{(save.error as Error).message}</p>}
      </form>
    </div>
  );
}
