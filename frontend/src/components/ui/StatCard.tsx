import type { ReactNode } from "react";

export default function StatCard({
  label,
  value,
  icon,
  hint,
  accent = "dat",
}: {
  label: string;
  value: ReactNode;
  icon?: string;
  hint?: string;
  accent?: "dat" | "men" | "green" | "red";
}) {
  const accents = {
    dat: "text-dat-700 bg-dat-50",
    men: "text-men-700 bg-men-50",
    green: "text-emerald-700 bg-emerald-50",
    red: "text-red-700 bg-red-50",
  };
  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl ${accents[accent]}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-ink-faint">{label}</p>
          <p className="text-xl font-extrabold text-ink">{value}</p>
        </div>
      </div>
      {hint && <p className="mt-2 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}
