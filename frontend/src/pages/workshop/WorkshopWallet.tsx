import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Landmark, Receipt, Wallet } from "lucide-react";
import { EmptyState, Money, Spinner, StatusBadge, toastError, toastOk } from "../../components/ui";
import { getMyWorkshop, getWorkshopWallet, updateWorkshop } from "../../lib/api";

export default function WorkshopWallet() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-wallet"],
    queryFn: getWorkshopWallet,
  });

  const workshop = useQuery({ queryKey: ["my-workshop"], queryFn: getMyWorkshop, retry: false });

  const [bankName, setBankName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");

  useEffect(() => {
    const w = workshop.data;
    if (w) {
      setBankName(w.bank_name ?? "");
      setBankAccountNo(w.bank_account_no ?? "");
      setBankAccountName(w.bank_account_name ?? "");
    }
  }, [workshop.data]);

  const saveBank = useMutation({
    mutationFn: () =>
      updateWorkshop({
        bank_name: bankName || undefined,
        bank_account_no: bankAccountNo || undefined,
        bank_account_name: bankAccountName || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-workshop"] });
      toastOk("Đã cập nhật tài khoản nhận tiền");
    },
    onError: (e) => toastError((e as Error).message),
  });

  if (isLoading) return <Spinner />;
  if (isError || !data)
    return <p className="text-red-600">Không tải được ví đối soát.</p>;

  const cards = [
    {
      label: "Tổng doanh thu (đã ghi nhận)",
      value: <Money value={data.total_gross} />,
      icon: Receipt,
      cls: "text-ceramic-900",
    },
    {
      label: "Hoa hồng nền tảng",
      value: <Money value={data.total_commission} />,
      icon: Landmark,
      cls: "text-dat-700",
    },
    {
      label: "Số tiền xưởng nhận về",
      value: <Money value={data.total_payout} />,
      icon: Wallet,
      cls: "text-green-700",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ceramic-900">Ví đối soát</h1>
      <p className="mt-1 text-sm text-gray-600">
        Tổng hợp doanh thu, hoa hồng và số tiền được chuyển về cho xưởng theo từng kỳ.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="rounded-xl border border-ceramic-100 bg-white p-4">
            <Icon className="h-5 w-5 text-slate-500" />
            <div className={`mt-3 text-xl font-bold ${cls}`}>{value}</div>
            <div className="mt-1 text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-ceramic-100 bg-white p-5">
        <h2 className="text-sm font-semibold text-ceramic-900">Tài khoản nhận đối soát</h2>
        <p className="mt-1 text-xs text-gray-500">
          Khai báo số tài khoản ngân hàng để nhận tiền doanh thu được chuyển về từ nền tảng.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="text-gray-600">Ngân hàng</span>
            <input
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="VD: BIDV"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">Số tài khoản</span>
            <input
              value={bankAccountNo}
              onChange={(e) => setBankAccountNo(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="VD: 7621982567"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">Chủ tài khoản</span>
            <input
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="VD: Nguyen Duy Vu"
            />
          </label>
        </div>
        <button
          onClick={() => saveBank.mutate()}
          disabled={saveBank.isPending}
          className="mt-4 rounded-lg bg-dat-700 px-5 py-2 text-sm font-semibold text-white hover:bg-dat-800 disabled:opacity-50"
        >
          {saveBank.isPending ? "Đang lưu..." : "Cập nhật tài khoản"}
        </button>
        {saveBank.isError && (
          <p className="mt-2 text-sm text-red-600">{(saveBank.error as Error).message}</p>
        )}
      </div>

      <div className="mt-6">
        {!data.periods || data.periods.length === 0 ? (
          <EmptyState
            icon={<Wallet className="h-12 w-12" />}
            title="Chưa có kỳ đối soát nào"
            hint="Doanh thu sẽ được ghi nhận sau khi đơn hàng được thanh toán."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-ceramic-100 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3">Kỳ</th>
                  <th className="px-4 py-3 text-right">Đơn đã ghi nhận</th>
                  <th className="px-4 py-3 text-right">Doanh thu</th>
                  <th className="px-4 py-3 text-right">Hoa hồng (10%)</th>
                  <th className="px-4 py-3 text-right">Số tiền nhận về</th>
                  <th className="px-4 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {data.periods.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium">{r.period}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{r.paid_orders}</td>
                    <td className="px-4 py-3 text-right"><Money value={r.gross_amount} /></td>
                    <td className="px-4 py-3 text-right text-dat-700"><Money value={r.commission_amount} /></td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700"><Money value={r.payout_amount} /></td>
                    <td className="px-4 py-3"><StatusBadge status={r.payout_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
