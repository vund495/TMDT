import { useQuery } from "@tanstack/react-query";
import { Ticket } from "lucide-react";
import { EmptyState, Money, Spinner, StatusBadge } from "../../components/ui";
import { getMyWorkshop, listWorkshopBookings } from "../../lib/api";

export default function WorkshopTours() {
  const workshop = useQuery({ queryKey: ["my-workshop"], queryFn: getMyWorkshop, retry: false });

  const bookings = useQuery({
    queryKey: ["my-tour-bookings"],
    queryFn: () => listWorkshopBookings(workshop.data!.id),
    enabled: !!workshop.data,
  });

  if (workshop.isLoading) return <Spinner />;
  if (!workshop.data) return <p className="text-gray-600">Bạn chưa tạo xưởng.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ceramic-900">Lịch tour trải nghiệm</h1>
      <p className="mt-1 text-sm text-gray-600">
        Danh sách đặt chỗ tour làm gốm của xưởng.
      </p>

      <div className="mt-6">
        {bookings.isLoading ? (
          <Spinner />
        ) : bookings.isError ? (
          <p className="text-red-600">Không tải được danh sách đặt tour.</p>
        ) : !bookings.data || bookings.data.length === 0 ? (
          <EmptyState icon={<Ticket className="h-12 w-12" />} title="Chưa có lượt đặt tour nào" />
        ) : (
          <div className="space-y-3">
            {bookings.data.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl border border-ceramic-100 bg-white p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{b.num_guests} khách</p>
                </div>
                <Money value={b.total_amount} className="font-bold text-brand-dat" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
