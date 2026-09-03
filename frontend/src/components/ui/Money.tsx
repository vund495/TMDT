import { cn } from "../../utils/ui";
import { formatVND } from "../../utils/format";

export default function Money({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return <span className={cn(className)}>{formatVND(Number.isFinite(value) ? value : 0)}</span>;
}
