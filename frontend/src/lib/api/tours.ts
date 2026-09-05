import { apiFetch } from "./client";
import type { TourBooking, TourBookingCreateOut, TourSlot } from "../../types";

export interface SlotQuery {
  workshop_id?: string;
  tour_date?: string;
}

export function listSlots(query: SlotQuery = {}): Promise<TourSlot[]> {
  const sp = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v) sp.set(k, v);
  });
  const q = sp.toString();
  return apiFetch<TourSlot[]>(`/api/v1/tours/slots${q ? `?${q}` : ""}`);
}

export function bookTour(slotId: string, numGuests = 1): Promise<TourBookingCreateOut> {
  return apiFetch<TourBookingCreateOut>("/api/v1/tours/bookings", {
    method: "POST",
    body: JSON.stringify({ slot_id: slotId, num_guests: numGuests }),
  });
}

export function createTourSpot(body: {
  workshop_id: string;
  tour_date: string;
  start_time: string;
  capacity: number;
  price_per_guest: number;
}): Promise<TourSlot[]> {
  return apiFetch<TourSlot[]>("/api/v1/tours/slots", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function listMyBookings(): Promise<TourBooking[]> {
  return apiFetch<TourBooking[]>("/api/v1/tours/bookings");
}

export function cancelBooking(id: string): Promise<TourBooking> {
  return apiFetch<TourBooking>(`/api/v1/tours/bookings/${id}/cancel`, { method: "POST" });
}

export function attendBooking(id: string): Promise<{ status: string; voucher_issued: boolean }> {
  return apiFetch<{ status: string; voucher_issued: boolean }>(
    `/api/v1/tours/bookings/${id}/attend`,
    { method: "POST" }
  );
}
