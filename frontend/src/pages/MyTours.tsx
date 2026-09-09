import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Clock, Ticket, Tag } from "lucide-react";
import { EmptyState, Money, Spinner, StatusBadge, toastError } from "../components/ui";
import PayQRModal from "../components/PayQRModal";
import { cancelBooking, listMyBookings } from "../lib/api";
import { toastOk } from "../lib/toast";

function fmtTime(t?: string | null) {
  if (!t) return "";
  return t.slice(0, 5);
}

export default function MyTours() {
  const qc = useQueryClient();
  const [paying, setPaying] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: listMyBookings,
    refetchInterval: 5000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["my-bookings"] });

  const prevPending = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!data) return;
    const prev = prevPending.current;
    for (const b of data) {
      if (b.status !== "pending_payment") {
        const was = prev.get(b.id);
        if (was === "pending_payment") {
          toastOk(`Tour đã thanh toán thành công`);
        }
        prev.delete(b.id);
      } else {
        prev.set(b.id, b.status);
      }
    }
    prevPending.current = prev;
  }, [data]);
  const cancel = useMutation({
    mutationFn: cancelBooking,
    onSuccess: invalidate,
    onError: (e) => toastError("Hủy tour thất bại", (e as Error).message),
  });

  const voucherCode = (id: string) => `TOUR-${id.slice(0, 6).toUpperCase()}`;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-ceramic-900">Tour của tôi</h1>
      <div className="mt-6">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="text-red-600">Không tìm thấy danh sách.</p>
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={<Ticket className="h-12 w-12" />}
            title="Chưa đặt tour nào"
            hint="Khám phá tour làm gốm để đặt và nhận voucher giảm giá"
            action={
              <Link
                to="/tim-kiem"
                className="rounded-md border border-cream-200 bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-cream-50"
              >
                Tìm tour
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {data.map((b) => (
              <div key={b.id} className="rounded-xl border border-ceramic-100 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={b.status} />
                    {b.voucher_issued && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-brand-lam/10 px-2 py-0.5 text-xs font-semibold text-brand-lam">
                        <Ticket className="h-3 w-3" aria-hidden /> Đã nhận voucher 10%
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    Đặt lúc {new Date(b.created_at).toLocaleString("vi-VN")}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 shrink-0 text-dat" aria-hidden />
                    <span className="font-medium">{b.workshop_name || "Xưởng gốm"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                    {b.tour_date ? new Date(`${b.tour_date}T00:00:00`).toLocaleDateString("vi-VN") : "Chưa có lịch"}
                    {b.start_time ? ` • ${fmtTime(b.start_time)}` : ""}
                  </div>
                  {b.workshop_address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                      {b.workshop_address}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                    {b.num_guests} khách • <Money value={b.total_amount} />
                  </div>
                </div>

                {b.status === "pending_payment" && (
                  <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    Chờ thanh toán - bấm "Thanh toán" để quét QR hoặc thanh toán qua VNPay.
                  </p>
                )}
                {b.status === "attended" && (
                  <div className="mt-3 rounded-md bg-brand-lam/5 px-3 py-2 text-sm">
                    <p className="font-medium text-brand-lam">Bạn đã tham dự tour - nhận voucher giảm 10% (tối đa 50.000đ)</p>
                    <p className="mt-1 flex items-center gap-2 text-gray-600">
                      Mã: <span className="font-mono font-bold text-brand-lam">{voucherCode(b.id)}</span>
                      <Link to="/ma-giam-gia" className="text-brand-lam underline">Xem ví voucher</Link>
                    </p>
                  </div>
                )}
                {b.status === "no_show" && (
                  <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                    Bạn không tham dự theo lịch đã đặt nên không nhận được voucher.
                  </p>
                )}
                {b.status === "cancelled" && (
                  <p className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-500">
                    Tour đã hủy - không nhận voucher.
                  </p>
                )}

                <div className="mt-3 flex gap-2">
                  {b.status === "pending_payment" && (
                    <button
                      onClick={() => setPaying(b.id)}
                      className="rounded-md bg-dat-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-dat-800"
                    >
                      Thanh toán
                    </button>
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
      <PayQRModal
        open={!!paying}
        onClose={() => {
          setPaying(null);
          invalidate();
        }}
        onPaid={() => {
          invalidate();
        }}
        refType="tour"
        refId={paying ?? ""}
        label="tour"
      />
    </div>
  );
}