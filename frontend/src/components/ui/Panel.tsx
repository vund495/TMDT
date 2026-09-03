import type { ReactNode } from "react";
import { cn } from "../../utils/ui";

export default function Panel({
  title,
  description,
  action,
  children,
  className,
  pad = true,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <section className={cn("rounded-2xl border border-cream-200 bg-white shadow-card", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 border-b border-cream-100 px-5 py-4">
          <div>
            {title && <h3 className="font-bold text-ink">{title}</h3>}
            {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn(pad && "p-5")}>{children}</div>
    </section>
  );
}
