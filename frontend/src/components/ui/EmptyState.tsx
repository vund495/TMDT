import type { ReactNode } from "react";

export default function EmptyState({
  icon = "📦",
  title,
  description,
  hint,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  hint?: string;
  action?: ReactNode;
}) {
  const text = hint ?? description;
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex items-center justify-center text-5xl">{icon}</div>
      <h3 className="mt-3 font-bold text-ink">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-ink-soft">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
