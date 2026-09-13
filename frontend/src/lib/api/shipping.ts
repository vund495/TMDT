import { apiFetch } from "./client";

export interface ShippingQuoteInput {
  shipping_method: "pickup" | "delivery";
  shipping_province?: string | null;
  subtotal: number;
}

export interface ShippingQuote {
  shipping_method: "pickup" | "delivery";
  shipping_province?: string | null;
  subtotal: number;
  fee: number;
}

export function shippingQuote(body: ShippingQuoteInput): Promise<ShippingQuote> {
  return apiFetch<ShippingQuote>("/api/v1/shipping/quote", {
    method: "POST",
    body: JSON.stringify(body),
  });
}