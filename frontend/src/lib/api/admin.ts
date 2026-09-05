import { apiFetch } from "./client";
import type { AdminUser, Dispute, Page, Product, Workshop } from "../../types";

export function listPendingWorkshops(): Promise<Workshop[]> {
  return apiFetch<Workshop[]>("/api/v1/admin/workshops/pending");
}

export function approveWorkshop(id: string): Promise<Workshop> {
  return apiFetch<Workshop>(`/api/v1/admin/workshops/${id}/approve`, { method: "POST" });
}

export function rejectWorkshop(id: string, reason: string): Promise<Workshop> {
  return apiFetch<Workshop>(`/api/v1/admin/workshops/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function listPendingProducts(params: { page?: number; page_size?: number } = {}): Promise<Page<Product>> {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  const qs = sp.toString();
  return apiFetch<Page<Product>>(`/api/v1/admin/products/pending${qs ? `?${qs}` : ""}`);
}

export function approveProduct(id: string): Promise<Product> {
  return apiFetch<Product>(`/api/v1/admin/products/${id}/approve`, { method: "POST" });
}

export function rejectProduct(id: string, reason: string): Promise<Product> {
  return apiFetch<Product>(`/api/v1/admin/products/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function listDisputes(): Promise<Dispute[]> {
  return apiFetch<Dispute[]>("/api/v1/admin/disputes");
}

export function listAdminUsers(params: { q?: string; role?: string; page?: number; page_size?: number } = {}): Promise<Page<AdminUser>> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.role) sp.set("role", params.role);
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  const qs = sp.toString();
  return apiFetch<Page<AdminUser>>(`/api/v1/admin/users${qs ? `?${qs}` : ""}`);
}

export function getAdminUser(id: string): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/api/v1/admin/users/${id}`);
}

export function setUserActive(id: string, is_active: boolean): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/api/v1/admin/users/${id}/set-active`, {
    method: "POST",
    body: JSON.stringify({ is_active }),
  });
}

export function resolveDispute(id: string, body: { resolution: string; admin_note?: string }): Promise<Dispute> {
  return apiFetch<Dispute>(`/api/v1/disputes/${id}/resolve`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export interface PlatformStats {
  total_revenue: number;
  orders_count: number;
  workshops_count: number;
  customers_count: number;
  disputes_pending: number;
}

export function getStats(): Promise<PlatformStats> {
  return apiFetch<PlatformStats>("/api/v1/admin/stats");
}

export interface ReconcileResult {
  total_revenue: number;
  total_orders_revenue: number;
  revenue_records_count: number;
  consistent: boolean;
}

export function reconcileRevenue(): Promise<ReconcileResult> {
  return apiFetch<ReconcileResult>("/api/v1/admin/reconcile-revenue", { method: "POST" });
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string | null;
  message: string;
  status: string;
  created_at?: string;
}

export function listContactMessages(): Promise<ContactMessage[]> {
  return apiFetch<ContactMessage[]>("/api/v1/feedback/contact");
}

export interface AdminTourBooking {
  booking_id: string;
  customer_id: string;
  workshop_id: string;
  tour_date: string;
  start_time: string;
  num_guests: number;
  total_amount: number;
  status: string;
  voucher_issued: boolean;
}

export function listAdminTourBookings(): Promise<AdminTourBooking[]> {
  return apiFetch<AdminTourBooking[]>("/api/v1/admin/tours/bookings");
}
