export type ToastState = {
  type: 'success' | 'error';
  message: string;
} | null;

export function Toast({ toast }: { toast: ToastState }) {
  if (!toast) {
    return null;
  }

  const styles =
    toast.type === 'success'
      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
      : 'border-rose-400/30 bg-rose-400/10 text-rose-100';

  return (
    <div className={`fixed right-4 top-4 z-[60] rounded-md border px-4 py-3 text-sm shadow-xl ${styles}`}>
      {toast.message}
    </div>
  );
}
