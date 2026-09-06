import { useQuery } from "@tanstack/react-query";
import { Landmark, Receipt, Wallet } from "lucide-react";
import { EmptyState, Money, Spinner } from "../../components/ui";
import { getWorkshopWallet } from "../../lib/api";

export default function WorkshopWallet() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-wallet"],
    queryFn: getWorkshopWallet,
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
                </tr>
              </thead>
              <tbody>
                {data.periods.map((r) => (
                  <tr key={r.period} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium">{r.period}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{r.paid_orders}</td>
                    <td className="px-4 py-3 text-right"><Money value={r.gross_amount} /></td>
                    <td className="px-4 py-3 text-right text-dat-700"><Money value={r.commission_amount} /></td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700"><Money value={r.payout_amount} /></td>
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
