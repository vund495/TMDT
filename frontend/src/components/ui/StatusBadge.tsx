import { cn } from "../../utils/ui";
import {
  TONE_BADGE,
  type Tone,
  ORDER_STATUS,
  WORKSHOP_STATUS,
  PRODUCT_STATUS,
  TOUR_STATUS,
  DISPUTE_STATUS,
  USER_STATUS,
} from "../../utils/status";

const ALL = {
  ...ORDER_STATUS,
  ...WORKSHOP_STATUS,
  ...PRODUCT_STATUS,
  ...TOUR_STATUS,
  ...DISPUTE_STATUS,
  ...USER_STATUS,
} as Record<string, { label: string; tone: Tone }>;

export function StatusBadge({ status }: { status: string }) {
  const meta = ALL[status];
  const tone: Tone = meta?.tone ?? "gray";
  const label = meta?.label ?? status;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        TONE_BADGE[tone]
      )}
    >
      {label}
    </span>
  );
}
