import { apiFetch } from "./client";
import type { Voucher } from "../../types";

export interface VoucherValidateResult {
  code: string;
  valid: boolean;
  discount_percent?: number;
  max_discount_amount?: number | null;
  message?: string;
}

export function validateVoucher(code: string): Promise<VoucherValidateResult> {
  return apiFetch<VoucherValidateResult>(`/api/v1/promotions/vouchers/${code}`);
}

// Admin CRUD (yêu cầu role admin)
export function listVouchers(): Promise<Voucher[]> {
  return apiFetch<Voucher[]>("/api/v1/promotions/vouchers");
}

export function createVoucher(body: {
  code: string;
  workshop_id?: string | null;
  discount_percent: number;
  max_discount_amount?: number | null;
  valid_from: string;
  valid_until: string;
  usage_limit?: number | null;
}): Promise<Voucher> {
  return apiFetch<Voucher>("/api/v1/promotions/vouchers", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateVoucher(
  code: string,
  body: {
    discount_percent?: number;
    max_discount_amount?: number | null;
    valid_from?: string;
    valid_until?: string;
    usage_limit?: number | null;
    active?: boolean;
  }
): Promise<Voucher> {
  return apiFetch<Voucher>(`/api/v1/promotions/vouchers/${code}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteVoucher(code: string): Promise<unknown> {
  return apiFetch(`/api/v1/promotions/vouchers/${code}`, { method: "DELETE" });
}

export function myVouchers(): Promise<Voucher[]> {
  return apiFetch<Voucher[]>("/api/v1/promotions/my-vouchers");
}
