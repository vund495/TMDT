import { apiFetch } from "./client";
import type { Order, OrderCreateOut, OrderDetail, Shipment } from "../../types";

export interface CreateOrderInput {
  items: { product_id: string; quantity: number }[];
  voucher_code?: string | null;
  receiver_name: string;
  receiver_phone: string;
  shipping_address: string;
  anti_shock_packed?: boolean;
}

export function createOrder(body: CreateOrderInput): Promise<OrderCreateOut> {
  return apiFetch<OrderCreateOut>("/api/v1/orders", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function listOrders(): Promise<Order[]> {
  return apiFetch<Order[]>("/api/v1/orders");
}

export function getOrder(id: string): Promise<OrderDetail> {
  return apiFetch<OrderDetail>(`/api/v1/orders/${id}`);
}

export function cancelOrder(id: string): Promise<Order> {
  return apiFetch<Order>(`/api/v1/orders/${id}/cancel`, { method: "POST" });
}

export function confirmReceipt(id: string): Promise<Order> {
  return apiFetch<Order>(`/api/v1/orders/${id}/confirm-receipt`, { method: "POST" });
}

export function getShipmentOfOrder(id: string): Promise<Shipment | null> {
  return apiFetch<Shipment | null>(`/api/v1/orders/${id}/shipment`);
}
