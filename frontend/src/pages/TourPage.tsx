import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, QrCode, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState, Money, Spinner } from "../components/ui";
import { bookTour, createVnpayPayment, listSlots } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { toastError } from "../components/ui";
import type { TourBookingCreateOut } from "../types";

export default function TourPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { profile } = useAuthStore();

  const [workshopId, setWorkshopId] = useState("");
  const [guests, setGuests] = useState<Record<string, number>>({});
  const [bookingResult, setBookingResult] = useState<TourBookingCreateOut | null>(null);

  const slots = useQuery({
    queryKey: ["slots"],
    queryFn: () => listSlots(),
  });

  const book = useMutation({
    mutationFn: ({ id, n }: { id: string; n: number }) => bookTour(id, n),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["slots"] });
      setBookingResult(data);
    },
    onError: (e) => toastError("Đặt tour thất bại", (e as Error).message),
  });

  if (slots.isLoading) return <Spinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ceramic-900">Tour trải nghiệm làm gốm</h1>
      <p className="mt-1 text-sm text-gray-600">
        Đặt lịch tham quan làng nghề, tự tay nặn và tráng men. Tham dự để nhận voucher giảm giá.
      </p>

      <div className="mt-6">
        {slots.isError ? (
          <p className="text-red-600">Không tải được lịch tour.</p>
        ) : !slots.data || slots.data.length === 0 ? (
          <EmptyState title="Chưa có lịch tour nào" hint="Các xưởng sẽ sớm mở lịch trải nghiệm." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {slots.data.map((s) => {
              const remaining = s.slots_left;
              const ng = guests[s.id] ?? 1;
              return (
                <div key={s.id} className="rounded-xl border border-ceramic-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CalendarDays className="h-4 w-4" />
                    <span>
                      {new Date(s.tour_date).toLocaleDateString("vi-VN")} · {s.start_time}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>
                      Còn <b>{remaining}</b> chỗ / tổng {s.capacity}
                    </span>
                  </div>
                  <div className="mt-3">
                    <Money value={s.price_per_guest} className="text-xl font-bold text-dat-700" />
                    <span className="text-sm text-gray-500"> / khách</span>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    {profile?.role === "customer" ? (
                      <>
                        <select
                          value={ng}
                          onChange={(e) => setGuests({ ...guests, [s.id]: Number(e.target.value) })}
                          disabled={remaining < 1}
                          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                        >
                          {Array.from({ length: Math.min(remaining, 10) }).map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1} khách
                            </option>
                          ))}
                        </select>
                        <button
                          disabled={book.isPending || remaining < 1}
                          onClick={() => book.mutate({ id: s.id, n: ng })}
                          className="flex-1 rounded-lg bg-dat-700 px-4 py-2 text-sm font-semibold text-white hover:bg-dat-800 disabled:opacity-50"
                        >
                          {remaining < 1 ? "Hết chỗ" : "Đặt tour"}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => navigate("/dang-nhap")}
                        className="flex-1 rounded-lg bg-dat-700 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Đăng nhập để đặt
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {bookingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2">
              <QrCode className="h-6 w-6 text-brand-lam" />
              <h2 className="text-lg font-bold text-ceramic-900">Quét mã QR để thanh toán</h2>
            </div>
            {bookingResult.qr_url ? (
              <img
                src={bookingResult.qr_url}
                alt="QR thanh toán"
                className="mx-auto mt-4 max-h-64 rounded-lg border"
              />
            ) : (
              <p className="mt-4 text-sm text-gray-500">Không tạo được mã QR. Vui lòng liên hệ hỗ trợ.</p>
            )}
            <p className="mt-3 text-center text-sm text-gray-600">
              Đơn: <b>{bookingResult.booking.total_amount.toLocaleString("vi-VN")}đ</b> · {bookingResult.booking.num_guests} khách
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  if (!bookingResult.payment_id) {
                    toastError("Lỗi", "Không có payment_id để thanh toán VNPay");
                    return;
                  }
                  createVnpayPayment(bookingResult.payment_id)
                    .then((r) => window.location.assign(r.pay_url))
                    .catch(() => navigate("/tour-cua-toi"));
                }}
                className="flex-1 rounded-lg bg-dat-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-dat-800"
              >
                Thanh toán VNPay
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => { setBookingResult(null); navigate("/tour-cua-toi"); }}
                className="flex-1 rounded-lg bg-ceramic-100 px-4 py-2.5 text-sm font-semibold text-ceramic-900 hover:bg-ceramic-200"
              >
                Xem tour của tôi
              </button>
              <button
                onClick={() => setBookingResult(null)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
