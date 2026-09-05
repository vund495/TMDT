import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { EmptyState, Money, Spinner, StatusBadge } from "../../components/ui";
import { listAdminTourBookings } from "../../lib/api";

export default function AdminTours() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-tour-bookings"],
    queryFn: listAdminTourBookings,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Đặt tour trải nghiệm</h1>
      <p className="mt-1 text-sm text-gray-600">
        Toàn bộ lịch đặt chỗ tour O2O của tất cả xưởng gốm trên sàn.
      </p>

      <div className="mt-6">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="text-red-600">Không tải được danh sách đặt tour.</p>
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-12 w-12" />}
            title="Chưa có lượt đặt tour nào"
            hint="Khi khách đặt tour, dữ liệu sẽ hiện tại đây."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Ngày</th>
                  <th className="px-4 py-3">Giờ</th>
                  <th className="px-4 py-3">Khách</th>
                  <th className="px-4 py-3">Tổng tiền</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Voucher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.map((b) => (
                  <tr key={b.booking_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{b.tour_date}</td>
                    <td className="px-4 py-3">{b.start_time}</td>
                    <td className="px-4 py-3">{b.num_guests}</td>
                    <td className="px-4 py-3">
                      <Money value={b.total_amount} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3">
                      {b.voucher_issued ? (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                          Đã phát
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
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