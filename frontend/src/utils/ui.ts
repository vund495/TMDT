export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export const inputClass =
  "w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-men-500 focus:outline-none focus:ring-2 focus:ring-men-200";

export function toneRing(tone: string): string {
  return `focus:ring-${tone}`;
}
