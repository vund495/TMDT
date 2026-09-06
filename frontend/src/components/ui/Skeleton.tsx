import { cn } from "../../utils/ui";

// Skeleton shimmer cho loading state (thay spinner tròn generic).
// Hình dạng phải khớp layout cuối, class animate-shimmer định nghĩa trong index.css.
export default function Skeleton({
  className,
}: {
  className?: string;
}) {
  return <div aria-hidden className={cn("animate-shimmer rounded-md bg-cream-100", className)} />;
}
