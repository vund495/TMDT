import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(...inputs));
}

// Quy ước shape (Shape Consistency Lock):
// - Card/panel: rounded-lg (12px)
// - Input/button: rounded-md (8px), riêng filter chip: rounded-full
// - Accent duy nhất cho commerce: dat-700. men-* chỉ dùng cho link/info.
export const inputClass =
  "w-full rounded-md border border-cream-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-dat-600 focus:outline-none focus:ring-2 focus:ring-dat-200";

const toneRingMap: Record<string, string> = {
  dat: "focus:ring-dat-200",
  men: "focus:ring-men-200",
  red: "focus:ring-red-200",
  green: "focus:ring-green-200",
};

export function toneRing(tone: string): string {
  return toneRingMap[tone] ?? "focus:ring-dat-200";
}
