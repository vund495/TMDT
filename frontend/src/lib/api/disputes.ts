import { apiFetch } from "./client";
import type { Dispute } from "../../types";

export function listMyDisputes(): Promise<Dispute[]> {
  return apiFetch<Dispute[]>("/api/v1/disputes/mine");
}

export function createDispute(body: {
  order_id: string;
  reason: string;
  evidence_urls?: string[];
}): Promise<Dispute> {
  return apiFetch<Dispute>("/api/v1/disputes", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getDispute(id: string): Promise<Dispute> {
  return apiFetch<Dispute>(`/api/v1/disputes/${id}`);
}

export function submitFeedback(body: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): Promise<unknown> {
  return apiFetch("/api/v1/feedback/contact", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
