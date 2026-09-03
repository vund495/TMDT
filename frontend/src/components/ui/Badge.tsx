import type { ReactNode } from "react";
import { cn } from "../../utils/ui";
import { TONE_BADGE, type Tone } from "../../utils/status";

export default function Badge({
  tone = "gray",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        TONE_BADGE[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
