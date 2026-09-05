import { cn, inputClass } from "../../utils/ui";

export default function Field({
  label,
  hint,
  error,
  className,
  input,
  trailing,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  input?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      {label && <span className="mb-1 block text-sm font-medium text-ink">{label}</span>}
      {trailing ? (
        <div className="relative">
          <input className={cn(inputClass, error && "border-red-400", input, "pr-10")} {...rest} />
          <span className="absolute inset-y-0 right-0 flex items-center pr-3">{trailing}</span>
        </div>
      ) : (
        <input className={cn(inputClass, error && "border-red-400", input)} {...rest} />
      )}
      {hint && !error && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
