import type { Task } from './types';

export function DeleteTaskModal({
  task,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  task: Task | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
      <div className="w-full max-w-md rounded-md border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <h2 className="text-xl font-semibold text-white">Delete task</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">Delete "{task.title}"? This action cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-md border border-white/10 px-4 py-2 text-slate-100">Cancel</button>
          <button type="button" disabled={isDeleting} onClick={onConfirm} className="rounded-md bg-rose-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-70">
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
