import { cn } from "../../utils/ui";

export default function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-5 w-5 animate-spin rounded-full border-2 border-men-200 border-t-men-700",
        className
      )}
      aria-label="Đang tải"
    />
  );
}
