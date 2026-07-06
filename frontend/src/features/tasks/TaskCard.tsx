import { Clock, CalendarDays, UserRound } from 'lucide-react';
import { taskPriorityLabels, taskStatusLabels } from './task-labels';
import type { Task } from './types';

const statusStyles = {
  TODO: 'bg-slate-400/10 text-slate-200 border-slate-400/20',
  IN_PROGRESS: 'bg-cyan-400/10 text-cyan-200 border-cyan-400/20',
  IN_REVIEW: 'bg-violet-400/10 text-violet-200 border-violet-400/20',
  DONE: 'bg-emerald-400/10 text-emerald-200 border-emerald-400/20',
};

const priorityStyles = {
  LOW: 'bg-slate-400/10 text-slate-200 border-slate-400/20',
  MEDIUM: 'bg-blue-400/10 text-blue-200 border-blue-400/20',
  HIGH: 'bg-amber-400/10 text-amber-200 border-amber-400/20',
  CRITICAL: 'bg-rose-400/10 text-rose-200 border-rose-400/20',
};

export function TaskCard({
  task,
  canDelete,
  onEdit,
  onDelete,
}: {
  task: Task;
  canDelete: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  return (
    <article className="rounded-md border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-white">{task.title}</h3>
          <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-slate-300">
            {task.description || 'No description yet.'}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[task.status]}`}>
          {taskStatusLabels[task.status]}
        </span>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${priorityStyles[task.priority]}`}>
          {taskPriorityLabels[task.priority]}
        </span>
      </div>
      <div className="mt-5 grid gap-3 text-sm text-slate-400 sm:grid-cols-3">
        <span className="inline-flex items-center gap-2">
          <CalendarDays size={16} />
          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
        </span>
        <span className="inline-flex items-center gap-2">
          <UserRound size={16} />
          {task.assignee?.name ?? 'Unassigned'}
        </span>
        <span className="inline-flex items-center gap-2">
          <Clock size={16} />
          {task.estimatedHours ?? 0}h
        </span>
      </div>
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="rounded-md border border-white/10 px-3 py-2 text-sm font-medium text-slate-100 hover:border-cyan-300 hover:text-cyan-200"
        >
          Edit
        </button>
        {canDelete ? (
          <button
            type="button"
            onClick={() => onDelete(task)}
            className="rounded-md border border-rose-400/30 px-3 py-2 text-sm font-medium text-rose-200 hover:bg-rose-400/10"
          >
            Delete
          </button>
        ) : null}
      </div>
    </article>
  );
}
