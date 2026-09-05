import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Ticket } from "lucide-react";
import { EmptyState, Money, Spinner, StatusBadge } from "../../components/ui";
import {
  attendBooking,
  createTourSpot,
  getMyWorkshop,
  listMyTourSlots,
  listWorkshopBookings,
} from "../../lib/api";
import { toastError, toastOk } from "../../lib/toast";
import { inputClass } from "../../utils/ui";

const BOOKING_STATUS: Record<string, string> = {
  pending_payment: "Chờ thanh toán",
  confirmed: "Đã xác nhận",
  cancelled: "Đã hủy",
  attended: "Đã tham dự",
  no_show: "Vắng mặt",
};

export default function WorkshopTours() {
  const qc = useQueryClient();
  const workshop = useQuery({ queryKey: ["my-workshop"], queryFn: getMyWorkshop, retry: false });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    tour_date: "",
    start_time: "08:00",
    capacity: "10",
    price_per_guest: "100000",
  });

  const slots = useQuery({
    queryKey: ["my-tour-slots"],
    queryFn: listMyTourSlots,
    enabled: !!workshop.data,
  });

  const bookings = useQuery({
    queryKey: ["my-tour-bookings"],
    queryFn: () => listWorkshopBookings(workshop.data!.id),
    enabled: !!workshop.data,
  });

  const createSlot = useMutation({
    mutationFn: () =>
      createTourSpot({
        workshop_id: workshop.data!.id,
        tour_date: form.tour_date,
        start_time: form.start_time,
        capacity: Number(form.capacity),
        price_per_guest: Number(form.price_per_guest),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-tour-slots"] });
      setShowForm(false);
      setForm({ tour_date: "", start_time: "08:00", capacity: "10", price_per_guest: "100000" });
      toastOk("Đã tạo suất tour");
    },
    onError: (e) => toastError("Không tạo được suất tour", (e as Error).message),
  });

  const attend = useMutation({
    mutationFn: attendBooking,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-tour-bookings"] });
      toastOk("Đã xác nhận khách tham dự, voucher 10% đã được phát");
    },
    onError: (e) => toastError("Không xác nhận được", (e as Error).message),
  });

  if (workshop.isLoading) return <Spinner />;
  if (!workshop.data) return <p className="text-gray-600">Bạn chưa tạo xưởng.</p>;

  const validForm = form.tour_date && form.capacity && form.price_per_guest;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ceramic-900">Lịch tour trải nghiệm</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tạo suất tour và theo dõi lượt đặt chỗ làm gốm của xưởng.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 rounded-lg bg-brand-dat px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dat-700"
        >
          <CalendarPlus className="h-4 w-4" /> Tạo suất tour
        </button>
      </div>

      {/* Suất tour */}
      <div className="mt-6">
        <h2 className="font-bold text-ceramic-900">Suất tour đang mở</h2>
        <div className="mt-3">
          {slots.isLoading ? (
            <Spinner />
          ) : slots.isError ? (
            <p className="text-red-600">Không tải được suất tour.</p>
          ) : !slots.data || slots.data.length === 0 ? (
            <EmptyState icon={<Ticket className="h-12 w-12" />} title="Chưa có suất tour nào" hint="Bấm “Tạo suất tour” để mở lịch cho khách đặt." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {slots.data.map((s) => (
                <div key={s.id} className="rounded-xl border border-ceramic-100 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-ceramic-900">
                      {new Date(s.tour_date + "T00:00:00").toLocaleDateString("vi-VN")}
                    </p>
                    <Money value={s.price_per_guest} className="text-sm font-bold text-brand-dat" />
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {s.start_time.slice(0, 5)} — {s.capacity} chỗ
                  </p>
                  <div className="mt-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        s.slots_left > 0 ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {s.slots_left > 0 ? `Còn ${s.slots_left} chỗ trống` : "Đã kín chỗ"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lượt đặt */}
      <div className="mt-8">
        <h2 className="font-bold text-ceramic-900">Lượt đặt chỗ</h2>
        <div className="mt-3">
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
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                        {BOOKING_STATUS[b.status] ?? b.status}
                      </span>
                      {b.voucher_issued && (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                          Voucher 10%
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{b.num_guests} khách</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Money value={b.total_amount} className="font-bold text-brand-dat" />
                    {b.status === "confirmed" && (
                      <button
                        onClick={() => attend.mutate(b.id)}
                        disabled={attend.isPending}
                        className="rounded-md bg-brand-lam px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-lam/90 disabled:opacity-50"
                      >
                        Xác nhận tham dự
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              if (validForm) createSlot.mutate();
            }}
            className="w-full max-w-md space-y-3 rounded-xl bg-white p-6"
          >
            <h2 className="font-bold text-gray-900">Tạo suất tour mới</h2>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink">Ngày diễn ra</span>
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={form.tour_date}
                onChange={(e) => setForm({ ...form, tour_date: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink">Giờ bắt đầu</span>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className={inputClass}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink">Sức chứa</span>
                <input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink">Giá / khách (đ)</span>
                <input
                  type="number"
                  min={0}
                  value={form.price_per_guest}
                  onChange={(e) => setForm({ ...form, price_per_guest: e.target.value })}
                  className={inputClass}
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
                Hủy
              </button>
              <button
                type="submit"
                disabled={!validForm || createSlot.isPending}
                className="rounded-md bg-brand-dat px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {createSlot.isPending ? "Đang tạo…" : "Tạo suất tour"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}