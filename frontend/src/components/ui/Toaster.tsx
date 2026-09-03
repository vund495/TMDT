import { useToast, type ToastTone } from "../../lib/toast";

const styles: Record<ToastTone, string> = {
  ok: "bg-emerald-600",
  info: "bg-men-700",
  warn: "bg-amber-600",
  danger: "bg-red-600",
};
const icons: Record<ToastTone, string> = {
  ok: "✓",
  info: "ℹ",
  warn: "!",
  danger: "!",
};

export default function Toaster() {
  const { toasts, dismiss } = useToast();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`flex items-start gap-2 rounded-xl px-4 py-3 text-left text-sm font-medium text-white shadow-pop ${styles[t.tone]}`}
        >
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/25 text-[10px]">
            {icons[t.tone]}
          </span>
          <span>
            <span className="font-semibold">{t.title}</span>
            {t.description && <span className="block text-xs opacity-90">{t.description}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}
