import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { EmptyState, Money, Spinner } from "../../components/ui";
import { getWorkshopRevenue } from "../../lib/api";

export default function WorkshopRevenue() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-revenue"],
    queryFn: getWorkshopRevenue,
  });

  const totals = (data ?? []).reduce(
    (s, r) => ({
      gross: s.gross + r.gross_amount,
      commission: s.commission + r.commission_amount,
      payout: s.payout + r.payout_amount,
    }),
    { gross: 0, commission: 0, payout: 0 }
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-ceramic-900">Doanh thu</h1>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-ceramic-100 bg-white p-4">
          <div className="text-xs text-gray-500">Tổng doanh thu</div>
          <div className="mt-1 text-xl font-bold text-ceramic-900">
            <Money value={totals.gross} />
          </div>
        </div>
        <div className="rounded-xl border border-ceramic-100 bg-white p-4">
          <div className="text-xs text-gray-500">Hoa hồng nền tảng</div>
          <div className="mt-1 text-xl font-bold text-dat-700">
            <Money value={totals.commission} />
          </div>
        </div>
        <div className="rounded-xl border border-ceramic-100 bg-white p-4">
          <div className="text-xs text-gray-500">Số tiền xưởng nhận</div>
          <div className="mt-1 text-xl font-bold text-green-700">
            <Money value={totals.payout} />
          </div>
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="text-red-600">Không tải được doanh thu.</p>
        ) : !data || data.length === 0 ? (
          <EmptyState icon={<Wallet className="h-12 w-12" />} title="Chưa có dữ liệu doanh thu" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-ceramic-100 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3">Kỳ</th>
                  <th className="px-4 py-3 text-right">Doanh thu</th>
                  <th className="px-4 py-3 text-right">Hoa hồng</th>
                  <th className="px-4 py-3 text-right">Nhận về</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.period} className="border-t border-gray-100">
                    <td className="px-4 py-3">{r.period}</td>
                    <td className="px-4 py-3 text-right"><Money value={r.gross_amount} /></td>
                    <td className="px-4 py-3 text-right"><Money value={r.commission_amount} /></td>
                    <td className="px-4 py-3 text-right font-semibold"><Money value={r.payout_amount} /></td>
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
