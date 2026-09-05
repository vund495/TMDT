import type { OrderStatus, TourBookingStatus, WorkshopStatus, ProductStatus, DisputeStatus } from "../types/domain";

export type Tone = "green" | "blue" | "amber" | "red" | "gray" | "slate";

const map = (label: string, tone: Tone) => ({ label, tone });

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  pending_payment: map("Chờ thanh toán", "amber"),
  preparing: map("Đang chuẩn bị", "blue"),
  shipping: map("Đang giao", "blue"),
  completed: map("Hoàn thành", "green"),
  disputing: map("Đang tranh chấp", "gray"),
  returned: map("Trả hàng", "red"),
};

export const WORKSHOP_STATUS: Record<WorkshopStatus, { label: string; tone: Tone }> = {
  pending: map("Chờ duyệt", "amber"),
  approved: map("Đã duyệt", "green"),
  rejected: map("Từ chối", "red"),
};

export const PRODUCT_STATUS: Record<ProductStatus, { label: string; tone: Tone }> = {
  draft: map("Bản nháp", "gray"),
  pending_review: map("Chờ duyệt", "amber"),
  active: map("Đang bán", "green"),
  approved: map("Đã duyệt", "green"),
  rejected: map("Từ chối", "red"),
};

export const TOUR_STATUS: Record<TourBookingStatus, { label: string; tone: Tone }> = {
  pending_payment: map("Chờ thanh toán", "amber"),
  confirmed: map("Đã xác nhận", "blue"),
  attended: map("Đã tham gia", "green"),
  cancelled: map("Đã huỷ", "red"),
  no_show: map("Vắng mặt", "gray"),
};

export const DISPUTE_STATUS: Record<DisputeStatus, { label: string; tone: Tone }> = {
  open: map("Mở", "amber"),
  reviewing: map("Đang xem xét", "blue"),
  resolved: map("Đã giải quyết", "green"),
};

export const USER_STATUS: Record<"active" | "blocked", { label: string; tone: Tone }> = {
  active: map("Đang hoạt động", "green"),
  blocked: map("Bị khóa", "red"),
};

export const RESOLUTION_LABEL: Record<string, string> = {
  approved: "Chấp thuận — hoàn tiền",
  reship: "Chấp thuận — gửi hàng thay thế",
  rejected: "Từ chối",
};

// map tone -> badge class
export const TONE_BADGE: Record<Tone, string> = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  blue: "bg-men-50 text-men-700 border-men-200",
  amber: "bg-dat-50 text-dat-700 border-dat-200",
  red: "bg-red-50 text-red-700 border-red-200",
  gray: "bg-gray-100 text-gray-600 border-gray-200",
  slate: "bg-slate-100 text-slate-600 border-slate-200",
};
