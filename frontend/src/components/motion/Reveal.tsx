import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

// LỰA CHỌN: motion/react whileInView thay vì GSAP + ScrollTrigger.
// Vì sao: chỉ cần reveal stagger đơn giản (không pin/scrub), Motion nhẹ hơn và đúng
// skeleton chuẩn §5.C của skill. GSAP chỉ đáng khi có scroll-hijack thật.
// Motion tách riêng ở leaf này, không trộn vào component data.
export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
