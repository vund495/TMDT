import { apiFetch } from "./client";
import type { Dispute, Product, Workshop } from "../../types";

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

export function listPendingProducts(): Promise<Product[]> {
  return apiFetch<Product[]>("/api/v1/admin/products/pending");
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
