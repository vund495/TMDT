import { create } from "zustand";

export type ToastTone = "ok" | "info" | "warn" | "danger";
export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastState {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

let counter = 0;
const nextId = () => `toast-${++counter}-${Date.now()}`;

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => set((s) => ({ toasts: [...s.toasts, { ...t, id: nextId() }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

export function toastOk(title: string, description?: string) {
  useToast.getState().push({ title, description, tone: "ok" });
}
export function toastInfo(title: string, description?: string) {
  useToast.getState().push({ title, description, tone: "info" });
}
export function toastWarn(title: string, description?: string) {
  useToast.getState().push({ title, description, tone: "warn" });
}
export function toastError(title: string, description?: string) {
  useToast.getState().push({ title, description, tone: "danger" });
}
