import { GitBranch, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAuthErrorMessage } from '../auth/form-errors';
import type { Task } from './types';
import { createTaskDependency, deleteTaskDependency, getTaskDependencies, type TaskDependencies } from './dependency-api';

type Toast = { type: 'success' | 'error' | 'warning'; message: string };

function DependencyList({ items, empty, onDelete }: { items: TaskDependencies['blockedBy']; empty: string; onDelete: (id: string) => void }) {
  if (items.length === 0) return <p className="rounded-md border border-dashed border-white/10 px-3 py-4 text-center text-sm text-slate-400">{empty}</p>;
  return <div className="space-y-2">{items.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2"><div className="min-w-0"><p className="truncate text-sm text-white">{item.task.title}</p><p className="text-xs text-slate-500">{item.task.status}</p></div><button type="button" onClick={() => onDelete(item.id)} className="text-rose-300 hover:text-rose-200"><Trash2 size={15} /></button></div>)}</div>;
}

export function TaskDependenciesPanel({ projectId, task, tasks, onToast, onChanged }: { projectId: string; task: Task; tasks: Task[]; onToast: (toast: Toast) => void; onChanged?: () => Promise<void> }) {
  const [dependencies, setDependencies] = useState<TaskDependencies>({ blockedBy: [], blocks: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [type, setType] = useState<'BLOCKED_BY' | 'BLOCKS'>('BLOCKED_BY');
  const availableTasks = useMemo(() => tasks.filter((item) => item.id !== task.id), [task.id, tasks]);

  const loadDependencies = useCallback(async () => {
    setIsLoading(true);
    try {
      setDependencies(await getTaskDependencies(projectId, task.id));
    } catch (error) {
      onToast({ type: 'error', message: getAuthErrorMessage(error, 'Unable to load dependencies.') });
    } finally {
      setIsLoading(false);
    }
  }, [onToast, projectId, task.id]);

  useEffect(() => { void loadDependencies(); }, [loadDependencies]);

  async function addDependency() {
    if (!selectedTaskId) return;
    try {
      await createTaskDependency(projectId, task.id, { taskId: selectedTaskId, type });
      setSelectedTaskId('');
      onToast({ type: 'success', message: 'Dependency added.' });
      await loadDependencies();
      await onChanged?.();
    } catch (error) {
      onToast({ type: 'error', message: getAuthErrorMessage(error, 'Unable to add dependency.') });
    }
  }

  async function removeDependency(relationId: string) {
    try {
      await deleteTaskDependency(projectId, task.id, relationId);
      onToast({ type: 'success', message: 'Dependency removed.' });
      await loadDependencies();
      await onChanged?.();
    } catch (error) {
      onToast({ type: 'error', message: getAuthErrorMessage(error, 'Unable to remove dependency.') });
    }
  }

  return (
    <section className="mt-6 border-t border-white/10 pt-6 sm:col-span-2">
      <div className="flex items-center gap-2"><GitBranch size={18} className="text-cyan-300" /><h3 className="font-semibold text-white">Dependencies</h3></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[150px_1fr_auto]">
        <select value={type} onChange={(event) => setType(event.target.value as 'BLOCKED_BY' | 'BLOCKS')} className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"><option value="BLOCKED_BY">Blocked By</option><option value="BLOCKS">Blocks</option></select>
        <select value={selectedTaskId} onChange={(event) => setSelectedTaskId(event.target.value)} className="min-w-0 rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Select a task</option>{availableTasks.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
        <button type="button" onClick={() => void addDependency()} className="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950">Add</button>
      </div>
      {isLoading ? <div className="mt-4 h-20 animate-pulse rounded-md bg-white/10" /> : <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><p className="mb-2 text-sm font-medium text-slate-200">Blocked By</p><DependencyList items={dependencies.blockedBy} empty="No blockers" onDelete={(id) => void removeDependency(id)} /></div><div><p className="mb-2 text-sm font-medium text-slate-200">Blocks</p><DependencyList items={dependencies.blocks} empty="Blocks no tasks" onDelete={(id) => void removeDependency(id)} /></div></div>}
    </section>
  );
}
