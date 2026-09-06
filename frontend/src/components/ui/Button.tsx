import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/ui";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all duration-150 active:translate-y-px active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dat-300 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-dat-700 text-white hover:bg-dat-800",
  secondary: "bg-men-700 text-white hover:bg-men-800",
  ghost: "border border-cream-200 bg-white text-ink hover:bg-cream-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  dark: "bg-ink text-cream-50 hover:bg-black",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  block,
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], block && "w-full", className)}
      {...rest}
    >
      {children}
    </button>
  );
}
