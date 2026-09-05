import { apiFetch } from "./client";
import type { Order, Page, Product, RevenuePeriod, TourBooking, TourSlot, Workshop, WorkshopWallet } from "../../types";

/** Workshop profile của chính mình (role workshop_owner) */
export function getMyWorkshop(): Promise<Workshop> {
  return apiFetch<Workshop>("/api/v1/workshop");
}

export function createWorkshop(body: {
  name: string;
  description?: string;
  address?: string;
  lat?: number;
  lng?: number;
  logo_url?: string;
}): Promise<Workshop> {
  return apiFetch<Workshop>("/api/v1/workshop", { method: "POST", body: JSON.stringify(body) });
}

export function updateWorkshop(body: {
  name?: string;
  description?: string;
  address?: string;
  lat?: number;
  lng?: number;
  logo_url?: string;
}): Promise<Workshop> {
  return apiFetch<Workshop>("/api/v1/workshop", { method: "PATCH", body: JSON.stringify(body) });
}

export function listMyProducts(params: { page?: number; page_size?: number } = {}): Promise<Page<Product>> {
  const sp = new URLSearchParams({ page: String(params.page ?? 1), page_size: String(params.page_size ?? 50) });
  return apiFetch<Page<Product>>(`/api/v1/workshop/products?${sp.toString()}`);
}

export function createProduct(body: {
  name: string;
  description?: string;
  theme?: string;
  material?: string;
  firing_technique?: string;
  glaze?: string;
  original_price: number;
  sale_price?: number;
  stock?: number;
  images?: string[];
  video_url?: string;
}): Promise<Product> {
  return apiFetch<Product>("/api/v1/workshop/products", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateProduct(
  productId: string,
  body: Partial<{
    name: string;
    description: string;
    theme: string;
    material: string;
    firing_technique: string;
    glaze: string;
    original_price: number;
    sale_price: number;
    stock: number;
    images: string[];
    video_url: string;
  }>
): Promise<Product> {
  return apiFetch<Product>(`/api/v1/workshop/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function publishProduct(productId: string): Promise<Product> {
  return apiFetch<Product>(`/api/v1/workshop/products/${productId}/publish`, { method: "POST" });
}

export function deleteProduct(productId: string): Promise<void> {
  return apiFetch<void>(`/api/v1/workshop/products/${productId}`, { method: "DELETE" });
}

export function listWorkshopOrders(status?: string): Promise<Order[]> {
  const sp = new URLSearchParams();
  if (status) sp.set("status", status);
  const q = sp.toString();
  return apiFetch<Order[]>(`/api/v1/workshop/orders${q ? `?${q}` : ""}`);
}

export function shipOrder(orderId: string): Promise<Order> {
  return apiFetch<Order>(`/api/v1/workshop/orders/${orderId}/ship`, { method: "POST" });
}

export function getWorkshopRevenue(): Promise<RevenuePeriod[]> {
  return apiFetch<RevenuePeriod[]>("/api/v1/workshop/revenue");
}

export function getWorkshopWallet(): Promise<WorkshopWallet> {
  return apiFetch<WorkshopWallet>("/api/v1/workshop/revenue/wallet");
}

export function listWorkshopBookings(workshopId: string): Promise<TourBooking[]> {
  return apiFetch<TourBooking[]>(`/api/v1/tours/workshops/${workshopId}/bookings`);
}

export function listMyTourSlots(): Promise<TourSlot[]> {
  return apiFetch<TourSlot[]>("/api/v1/workshop/slots");
}
