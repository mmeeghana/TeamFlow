import { ArrowLeft, Plus, Search, Trash2, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { Toast, type ToastState } from '../components/Toast';
import { getAuthErrorMessage } from '../features/auth/form-errors';
import { inviteProjectMember, getProject, removeProjectMember } from '../features/projects/project-api';
import type { Project } from '../features/projects/types';
import { useAuth } from '../features/auth/useAuth';
import { TaskCard } from '../features/tasks/TaskCard';
import { DeleteTaskModal } from '../features/tasks/DeleteTaskModal';
import { TaskModal, type TaskFormValues } from '../features/tasks/TaskModal';
import { createTask, deleteTask, reorderTasks, updateTask, updateTaskDueDate } from '../features/tasks/task-api';
import { taskPriorityLabels, taskStatusLabels } from '../features/tasks/task-labels';
import type { Task, TaskPriority, TaskStatus } from '../features/tasks/types';
import { useTasks } from '../features/tasks/useTasks';
import { TaskSkeleton } from '../features/tasks/TaskSkeleton';
import { ActivityTimeline } from '../features/activity/ActivityTimeline';
import { NotificationBell } from '../features/notifications/NotificationBell';
import { KanbanBoard } from '../features/tasks/KanbanBoard';
import { TaskCalendar } from '../features/tasks/TaskCalendar';

type InviteValues = { email: string };

export function ProjectDetailsPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const [taskPage, setTaskPage] = useState(1);
  const [taskView, setTaskView] = useState<'list' | 'kanban' | 'calendar'>('list');
  const [taskFilters, setTaskFilters] = useState<{
    search: string;
    status: TaskStatus | '';
    priority: TaskPriority | '';
    assigneeId: string;
  }>({ search: '', status: '', priority: '', assigneeId: '' });
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);
  const { tasks, meta: taskMeta, stats, isLoading: areTasksLoading, error: taskError, reload: reloadTasks } =
    useTasks(projectId, taskFilters, taskPage, taskView === 'list' ? 8 : 50);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<InviteValues>();

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      setProject(await getProject(projectId));
    } catch (error) {
      setToast({ type: 'error', message: getAuthErrorMessage(error, 'Unable to load project.') });
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  async function onInvite(values: InviteValues) {
    if (!projectId) return;
    try {
      await inviteProjectMember(projectId, values.email);
      reset();
      setToast({ type: 'success', message: 'Member invited.' });
      await loadProject();
    } catch (error) {
      setToast({ type: 'error', message: getAuthErrorMessage(error, 'Unable to invite member.') });
    }
  }

  async function onRemove(userId: string) {
    if (!projectId) return;
    try {
      await removeProjectMember(projectId, userId);
      setToast({ type: 'success', message: 'Member removed.' });
      await loadProject();
    } catch (error) {
      setToast({ type: 'error', message: getAuthErrorMessage(error, 'Unable to remove member.') });
    }
  }

  const isOwner = project?.ownerId === user?.id;

  function showToast(nextToast: ToastState) {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 3000);
  }

  function toTaskPayload(values: TaskFormValues) {
    return {
      title: values.title,
      description: values.description || null,
      status: values.status,
      priority: values.priority,
      dueDate: values.dueDate || null,
      estimatedHours: values.estimatedHours ? Number(values.estimatedHours) : null,
      assigneeId: values.assigneeId || null,
    };
  }

  async function onCreateTask(values: TaskFormValues) {
    if (!projectId) return;
    setIsTaskSubmitting(true);
    try {
      await createTask(projectId, toTaskPayload(values));
      setIsTaskModalOpen(false);
      showToast({ type: 'success', message: 'Task created.' });
      setActivityRefreshKey((key) => key + 1);
      await Promise.all([reloadTasks(), loadProject()]);
    } catch (error) {
      showToast({ type: 'error', message: getAuthErrorMessage(error, 'Unable to create task.') });
    } finally {
      setIsTaskSubmitting(false);
    }
  }

  async function onUpdateTask(values: TaskFormValues) {
    if (!projectId || !editingTask) return;
    setIsTaskSubmitting(true);
    try {
      await updateTask(projectId, editingTask.id, toTaskPayload(values));
      setEditingTask(null);
      showToast({ type: 'success', message: 'Task updated.' });
      setActivityRefreshKey((key) => key + 1);
      await reloadTasks();
    } catch (error) {
      showToast({ type: 'error', message: getAuthErrorMessage(error, 'Unable to update task.') });
    } finally {
      setIsTaskSubmitting(false);
    }
  }

  async function onTaskDueDateChange(task: Task, dueDate: string) {
    if (!projectId) return;
    try {
      await updateTaskDueDate(projectId, task.id, dueDate);
      showToast({ type: 'success', message: 'Task due date updated.' });
      setActivityRefreshKey((key) => key + 1);
      await reloadTasks();
    } catch (error) {
      showToast({ type: 'error', message: getAuthErrorMessage(error, 'Unable to update due date.') });
      throw error;
    }
  }
  async function onReorderTasks(nextTasks: Array<{ id: string; status: TaskStatus; position: number }>) {
    if (!projectId) return;
    try {
      await reorderTasks(projectId, nextTasks);
      showToast({ type: 'success', message: 'Board updated.' });
      setActivityRefreshKey((key) => key + 1);
      await reloadTasks();
    } catch (error) {
      showToast({ type: 'error', message: getAuthErrorMessage(error, 'Unable to update board.') });
      await reloadTasks();
    }
  }
  async function onDeleteTask() {
    if (!projectId || !deletingTask) return;
    setIsTaskSubmitting(true);
    try {
      await deleteTask(projectId, deletingTask.id);
      setDeletingTask(null);
      showToast({ type: 'success', message: 'Task deleted.' });
      await Promise.all([reloadTasks(), loadProject()]);
    } catch (error) {
      showToast({ type: 'error', message: getAuthErrorMessage(error, 'Unable to delete task.') });
    } finally {
      setIsTaskSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <Toast toast={toast} />
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-cyan-300">
            <ArrowLeft size={16} /> Projects
          </Link>
          <NotificationBell onToast={showToast} />
        </div>
        {isLoading ? (
          <p className="mt-10 text-slate-300">Loading project...</p>
        ) : project ? (
          <div className="mt-8">
            <div className="h-2 w-20 rounded-full" style={{ backgroundColor: project.themeColor }} />
            <h1 className="mt-5 text-4xl font-semibold tracking-normal">{project.name}</h1>
            <p className="mt-4 max-w-3xl text-slate-300">{project.description || 'No description yet.'}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <div className="rounded-md border border-white/10 p-5">
                <p className="text-sm text-slate-400">Total Tasks</p>
                <p className="mt-2 text-3xl font-semibold">{stats.total}</p>
              </div>
              <div className="rounded-md border border-white/10 p-5">
                <p className="text-sm text-slate-400">Completed</p>
                <p className="mt-2 text-3xl font-semibold">{stats.completed}</p>
              </div>
              <div className="rounded-md border border-white/10 p-5">
                <p className="text-sm text-slate-400">Pending</p>
                <p className="mt-2 text-3xl font-semibold">{stats.pending}</p>
              </div>
              <div className="rounded-md border border-white/10 p-5">
                <p className="text-sm text-slate-400">Overdue</p>
                <p className="mt-2 text-3xl font-semibold">{stats.overdue}</p>
              </div>
              <div className="rounded-md border border-white/10 p-5">
                <p className="text-sm text-slate-400">Progress</p>
                <p className="mt-2 text-3xl font-semibold">{stats.progress}%</p>
              </div>
            </div>
            <section className="mt-10">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">Tasks</h2>
                  <div className="rounded-md border border-white/10 p-1">
                    <button type="button" onClick={() => setTaskView('list')} className={`rounded px-3 py-1 text-sm ${taskView === 'list' ? 'bg-cyan-300 text-slate-950' : 'text-slate-300'}`}>List View</button>
                    <button type="button" onClick={() => setTaskView('kanban')} className={`rounded px-3 py-1 text-sm ${taskView === 'kanban' ? 'bg-cyan-300 text-slate-950' : 'text-slate-300'}`}>Kanban View</button>
                    <button type="button" onClick={() => setTaskView('calendar')} className={`rounded px-3 py-1 text-sm ${taskView === 'calendar' ? 'bg-cyan-300 text-slate-950' : 'text-slate-300'}`}>Calendar</button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 py-2 font-semibold text-slate-950"
                >
                  <Plus size={16} /> Create Task
                </button>
              </div>
              <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_160px_160px_220px]">
                <div className="flex items-center gap-3 rounded-md border border-white/10 bg-white/5 px-4 py-3">
                  <Search size={18} className="text-slate-400" />
                  <input
                    value={taskFilters.search}
                    onChange={(event) => {
                      setTaskPage(1);
                      setTaskFilters((current) => ({ ...current, search: event.target.value }));
                    }}
                    placeholder="Search tasks"
                    className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
                  />
                </div>
                <select
                  value={taskFilters.status}
                  onChange={(event) => {
                    setTaskPage(1);
                    setTaskFilters((current) => ({ ...current, status: event.target.value as TaskStatus | '' }));
                  }}
                  className="rounded-md border border-white/10 bg-slate-950 px-4 py-3 text-white"
                >
                  <option value="">All statuses</option>
                  {Object.entries(taskStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <select
                  value={taskFilters.priority}
                  onChange={(event) => {
                    setTaskPage(1);
                    setTaskFilters((current) => ({ ...current, priority: event.target.value as TaskPriority | '' }));
                  }}
                  className="rounded-md border border-white/10 bg-slate-950 px-4 py-3 text-white"
                >
                  <option value="">All priorities</option>
                  {Object.entries(taskPriorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <select
                  value={taskFilters.assigneeId}
                  onChange={(event) => {
                    setTaskPage(1);
                    setTaskFilters((current) => ({ ...current, assigneeId: event.target.value }));
                  }}
                  className="rounded-md border border-white/10 bg-slate-950 px-4 py-3 text-white"
                >
                  <option value="">All assignees</option>
                  {project.members.map((member) => <option key={member.userId} value={member.userId}>{member.user.name}</option>)}
                </select>
              </div>
              {taskError ? <p className="mt-5 text-rose-300">{taskError}</p> : null}
              {areTasksLoading ? (
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => <TaskSkeleton key={index} />)}
                </div>
              ) : tasks.length === 0 ? (
                <div className="mt-6 rounded-md border border-dashed border-white/15 px-6 py-12 text-center">
                  <p className="text-lg font-medium text-white">No tasks yet</p>
                </div>
              ) : taskView === 'calendar' ? (
                <div className="mt-6">
                  <TaskCalendar tasks={tasks} onEventClick={setEditingTask} onDueDateChange={onTaskDueDateChange} />
                </div>
              ) : taskView === 'kanban' ? (
                <div className="mt-6">
                  <KanbanBoard tasks={tasks} onEdit={setEditingTask} onReorder={onReorderTasks} />
                </div>
              ) : (
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      canDelete={isOwner || task.creatorId === user?.id}
                      onEdit={setEditingTask}
                      onDelete={setDeletingTask}
                    />
                  ))}
                </div>
              )}
              {taskMeta && taskMeta.pageCount > 1 ? (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button disabled={taskPage <= 1} onClick={() => setTaskPage((current) => Math.max(1, current - 1))} className="rounded-md border border-white/10 px-4 py-2 text-sm disabled:opacity-50">Previous</button>
                  <span className="text-sm text-slate-400">Page {taskMeta.page} of {taskMeta.pageCount}</span>
                  <button disabled={taskPage >= taskMeta.pageCount} onClick={() => setTaskPage((current) => current + 1)} className="rounded-md border border-white/10 px-4 py-2 text-sm disabled:opacity-50">Next</button>
                </div>
              ) : null}
            </section>
            <section className="mt-10">
              <h2 className="text-xl font-semibold">Members</h2>
              {isOwner ? (
                <form className="mt-4 flex max-w-xl gap-3" onSubmit={handleSubmit(onInvite)}>
                  <input
                    type="email"
                    placeholder="member@example.com"
                    className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-cyan-300"
                    {...register('email', { required: true })}
                  />
                  <button disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm font-medium">
                    <UserPlus size={16} /> Invite
                  </button>
                </form>
              ) : null}
              <div className="mt-5 divide-y divide-white/10 rounded-md border border-white/10">
                {project.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div>
                      <p className="font-medium">{member.user.name}</p>
                      <p className="text-sm text-slate-400">{member.user.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-400">{member.role}</span>
                      {isOwner && member.userId !== user?.id ? (
                        <button onClick={() => void onRemove(member.userId)} className="text-rose-300">
                          <Trash2 size={16} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <ActivityTimeline projectId={project.id} refreshKey={activityRefreshKey} onToast={showToast} />
          </div>
        ) : (
          <p className="mt-10 text-slate-300">Project not found.</p>
        )}
      </section>
      <TaskModal
        title="Create task"
        members={project?.members ?? []}
        isOpen={isTaskModalOpen}
        isSubmitting={isTaskSubmitting}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={onCreateTask}
      />
      <TaskModal
        title="Edit task"
        task={editingTask}
        members={project?.members ?? []}
        isOpen={Boolean(editingTask)}
        isSubmitting={isTaskSubmitting}
        onClose={() => setEditingTask(null)}
        onSubmit={onUpdateTask}
        projectId={projectId}
        currentUserId={user?.id}
        onToast={showToast}
        projectOwnerId={project?.ownerId}
        onCommentsChanged={async () => {
          setActivityRefreshKey((key) => key + 1);
        }}
        onAttachmentsChanged={async () => {
          setActivityRefreshKey((key) => key + 1);
        }}
      />
      <DeleteTaskModal
        task={deletingTask}
        isDeleting={isTaskSubmitting}
        onCancel={() => setDeletingTask(null)}
        onConfirm={onDeleteTask}
      />
    </main>
  );
}






