import { apiFetch } from "./client";

export interface PassportResult {
  found: boolean;
  message?: string;
  qr_code?: string;
  product_id?: string;
  product_name?: string;
  material?: string | null;
  firing_technique?: string | null;
  glaze?: string | null;
  theme?: string | null;
  workshop_id?: string;
  unlocked?: boolean;
  video_url?: string | null;
}

export function getPassport(qrCode: string): Promise<PassportResult> {
  return apiFetch<PassportResult>(`/api/v1/passport/${encodeURIComponent(qrCode)}`);
}
