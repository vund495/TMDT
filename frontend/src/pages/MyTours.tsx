import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ticket } from "lucide-react";
import { EmptyState, Money, Spinner, StatusBadge, toastError } from "../components/ui";
import { cancelBooking, listMyBookings } from "../lib/api";

export default function MyTours() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: listMyBookings,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["my-bookings"] });
  const cancel = useMutation({
    mutationFn: cancelBooking,
    onSuccess: invalidate,
    onError: (e) => toastError("Hủy tour thất bại", (e as Error).message),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ceramic-900">Tour của tôi</h1>
      <div className="mt-6">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="text-red-600">Không tìm thấy danh sách.</p>
        ) : !data || data.length === 0 ? (
          <EmptyState icon={<Ticket className="h-12 w-12" />} title="Chưa đặt tour nào" hint="Khám phá tour để nhận voucher" />
        ) : (
          <div className="space-y-3">
            {data.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between rounded-xl border border-ceramic-100 bg-white p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    {b.num_guests} khách
                  </div>
                  <div className="font-semibold text-dat">
                    <Money value={b.total_amount} />
                  </div>
                </div>
                <div className="flex gap-2">
                  {b.status === "pending_payment" && (
                    <span className="rounded-md bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">
                      Chờ thanh toán - vui lòng quét QR tại trang đặt tour
                    </span>
                  )}
                  {(b.status === "confirmed" || b.status === "pending_payment") && (
                    <button
                      onClick={() => cancel.mutate(b.id)}
                      disabled={cancel.isPending}
                      className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                    >
                      Hủy tour
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
