import { apiFetch } from "./client";

export interface VnpayCreateOut {
  pay_url: string;
  txn_ref: string;
}

export function createVnpayPayment(paymentId: string): Promise<VnpayCreateOut> {
  return apiFetch<VnpayCreateOut>("/api/v1/payments/vnpay/create", {
    method: "POST",
    body: JSON.stringify({ payment_id: paymentId }),
  });
}