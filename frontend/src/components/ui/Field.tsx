import { cn, inputClass } from "../../utils/ui";

export default function Field({
  label,
  hint,
  error,
  className,
  input,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  input?: string;
}) {
  return (
    <label className={cn("block", className)}>
      {label && <span className="mb-1 block text-sm font-medium text-ink">{label}</span>}
      <input className={cn(inputClass, error && "border-red-400", input)} {...rest} />
      {hint && !error && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
