import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { ProjectMember } from '../projects/types';
import { taskPriorityLabels, taskStatusLabels } from './task-labels';
import { CommentsPanel } from '../comments/CommentsPanel';
import type { Task, TaskPriority, TaskStatus } from './types';

export type TaskFormValues = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  estimatedHours: string;
  assigneeId: string;
};

const statuses = Object.entries(taskStatusLabels) as Array<[TaskStatus, string]>;
const priorities = Object.entries(taskPriorityLabels) as Array<[TaskPriority, string]>;

function formatDateForInput(value: string | null) {
  if (!value) return '';
  return value.slice(0, 10);
}

export function TaskModal({
  title,
  task,
  members,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  projectId,
  currentUserId,
  onToast,
  onCommentsChanged,
}: {
  title: string;
  task?: Task | null;
  members: ProjectMember[];
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  projectId?: string;
  currentUserId?: string;
  onToast?: (toast: { type: 'success' | 'error'; message: string }) => void;
  onCommentsChanged?: () => Promise<void>;
}) {
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues>({
    defaultValues: {
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: '',
      estimatedHours: '',
      assigneeId: '',
    },
  });

  useEffect(() => {
    reset({
      title: task?.title ?? '',
      description: task?.description ?? '',
      status: task?.status ?? 'TODO',
      priority: task?.priority ?? 'MEDIUM',
      dueDate: formatDateForInput(task?.dueDate ?? null),
      estimatedHours: task?.estimatedHours?.toString() ?? '',
      assigneeId: task?.assigneeId ?? '',
    });
  }, [isOpen, reset, task]);

  if (!isOpen) return null;

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 px-4 py-8">
    <div className="w-full max-w-2xl rounded-md border border-white/10 bg-slate-900 p-6 shadow-2xl">
      <h2 className="text-xl font-semibold text-white">{title}</h2>

      {/* TASK FORM */}
      <form
        className="mt-6 grid gap-5 sm:grid-cols-2"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="task-title">
            Title
          </label>
          <input
            id="task-title"
            className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300"
            {...register("title", {
              required: "Task title is required.",
              minLength: 2,
            })}
          />
          {errors.title ? (
            <p className="mt-2 text-sm text-rose-300">{errors.title.message}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <label
            className="text-sm font-medium text-slate-200"
            htmlFor="task-description"
          >
            Description
          </label>
          <textarea
            id="task-description"
            rows={3}
            className="mt-2 w-full resize-none rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300"
            {...register("description")}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-200" htmlFor="task-status">
            Status
          </label>
          <select
            id="task-status"
            className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-4 py-3 text-white"
            {...register("status")}
          >
            {statuses.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="text-sm font-medium text-slate-200"
            htmlFor="task-priority"
          >
            Priority
          </label>
          <select
            id="task-priority"
            className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-4 py-3 text-white"
            {...register("priority")}
          >
            {priorities.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="text-sm font-medium text-slate-200"
            htmlFor="task-due-date"
          >
            Due Date
          </label>
          <input
            id="task-due-date"
            type="date"
            className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white"
            {...register("dueDate")}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-200" htmlFor="task-hours">
            Estimated Hours
          </label>
          <input
            id="task-hours"
            type="number"
            min="0"
            step="0.25"
            className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white"
            {...register("estimatedHours")}
          />
        </div>

        <div className="sm:col-span-2">
          <label
            className="text-sm font-medium text-slate-200"
            htmlFor="task-assignee"
          >
            Assign To
          </label>
          <select
            id="task-assignee"
            className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-4 py-3 text-white"
            {...register("assigneeId")}
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.user.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 sm:col-span-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/10 px-4 py-2 text-slate-100"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-cyan-300 px-4 py-2 font-semibold text-slate-950 disabled:opacity-70"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>

      {/* COMMENTS SECTION - OUTSIDE THE FORM */}
      {task && projectId && onToast ? (
        <CommentsPanel
          projectId={projectId}
          taskId={task.id}
          currentUserId={currentUserId}
          onToast={onToast}
          onChanged={onCommentsChanged}
        />
      ) : null}
    </div>
  </div>
);
}



