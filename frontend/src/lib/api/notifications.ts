import { apiFetch } from "./client";
import type { NotificationItem } from "../../types";

export function listNotifications(): Promise<NotificationItem[]> {
  return apiFetch<NotificationItem[]>("/api/v1/notifications");
}

export function listNews(): Promise<NotificationItem[]> {
  return apiFetch<NotificationItem[]>("/api/v1/notifications/news");
}

export function markNotificationRead(id: string): Promise<NotificationItem> {
  return apiFetch<NotificationItem>(`/api/v1/notifications/${id}/read`, {
    method: "POST",
  });
}