import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

// Fade transition khi chuyển trang trong khu admin/xưởng.
// Kết hợp với import tĩnh (không lazy) để vừa hết "nháy" vừa có hiệu ứng mượt.
export default function PageTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
