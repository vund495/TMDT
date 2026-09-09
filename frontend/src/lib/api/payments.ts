import { apiFetch } from "./client";

export interface PaymentQrOut {
  qr_url?: string | null;
  code: string;
  amount: number;
  payment_id?: string | null;
  status: string;
}

export function getPaymentQr(refType: "order" | "tour", refId: string): Promise<PaymentQrOut> {
  return apiFetch<PaymentQrOut>("/api/v1/payments/qr", {
    method: "POST",
    body: JSON.stringify({ ref_type: refType, ref_id: refId }),
  });
}

export function getPaymentStatus(
  refType: "order" | "tour",
  refId: string
): Promise<PaymentQrOut> {
  return apiFetch<PaymentQrOut>("/api/v1/payments/status", {
    method: "POST",
    body: JSON.stringify({ ref_type: refType, ref_id: refId }),
  });
}