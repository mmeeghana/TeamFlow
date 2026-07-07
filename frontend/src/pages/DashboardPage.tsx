import { LogOut, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Toast, type ToastState } from '../components/Toast';
import { NotificationBell } from '../features/notifications/NotificationBell';
import { ThemeToggle } from '../features/theme/ThemeToggle';
import { DashboardAnalytics } from '../features/dashboard/DashboardAnalytics';
import { useAuth } from '../features/auth/useAuth';
import { DeleteProjectModal } from '../features/projects/DeleteProjectModal';
import { ProjectCard } from '../features/projects/ProjectCard';
import { ProjectModal, type ProjectFormValues } from '../features/projects/ProjectModal';
import { createProject, deleteProject, updateProject } from '../features/projects/project-api';
import type { Project } from '../features/projects/types';
import { useProjects } from '../features/projects/useProjects';
import { downloadCsv } from '../utils/csv';

export function DashboardPage() {
  const { logout, user } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<ToastState>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { projects, meta, isLoading, error, reload } = useProjects(search, page);

  function showToast(nextToast: ToastState) {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 3000);
  }

  async function handleCreate(values: ProjectFormValues) {
    setIsSubmitting(true);
    try {
      await createProject(values);
      setIsCreateOpen(false);
      showToast({ type: 'success', message: 'Project created.' });
      await reload();
    } catch {
      showToast({ type: 'error', message: 'Unable to create project.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(values: ProjectFormValues) {
    if (!editingProject) return;
    setIsSubmitting(true);
    try {
      await updateProject(editingProject.id, values);
      setEditingProject(null);
      showToast({ type: 'success', message: 'Project updated.' });
      await reload();
    } catch {
      showToast({ type: 'error', message: 'Unable to update project.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  function exportProjects() {
    downloadCsv('projects.csv', projects.map((project) => ({ id: project.id, name: project.name, owner: project.owner.name, members: project._count.members, tasks: project._count.tasks, createdAt: project.createdAt })));
  }

  async function handleDelete() {
    if (!deletingProject) return;
    setIsSubmitting(true);
    try {
      await deleteProject(deletingProject.id);
      setDeletingProject(null);
      showToast({ type: 'success', message: 'Project deleted.' });
      await reload();
    } catch {
      showToast({ type: 'error', message: 'Unable to delete project.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <Toast toast={toast} />
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">TeamFlow</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationBell onToast={showToast} />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-300 hover:text-cyan-200"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-lg text-slate-200">Welcome, {user?.name}.</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">Analytics</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportProjects}
              className="rounded-md border border-white/10 px-4 py-3 font-semibold text-slate-100"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-200"
            >
              <Plus size={18} />
              Create Project
            </button>
          </div>
        </div>

        <div className="mt-8">
          <DashboardAnalytics onToast={showToast} />
        </div>

        <div className="mt-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h2 className="text-2xl font-semibold tracking-normal">Projects</h2>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-md border border-white/10 bg-white/5 px-4 py-3">
          <Search size={18} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Search projects by name"
            className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
          />
        </div>

        {error ? <p className="mt-6 text-rose-300">{error}</p> : null}
        {isLoading ? <p className="mt-8 text-slate-300">Loading projects...</p> : null}

        {!isLoading && projects.length === 0 ? (
          <div className="mt-10 rounded-md border border-dashed border-white/15 px-6 py-14 text-center">
            <p className="text-lg font-medium text-white">No projects yet</p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              canManage={project.ownerId === user?.id}
              onEdit={setEditingProject}
              onDelete={setDeletingProject}
            />
          ))}
        </div>

        {meta && meta.pageCount > 1 ? (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-md border border-white/10 px-4 py-2 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-400">
              Page {meta.page} of {meta.pageCount}
            </span>
            <button
              type="button"
              disabled={page >= meta.pageCount}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-md border border-white/10 px-4 py-2 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        ) : null}
      </section>
      <ProjectModal
        title="Create project"
        isOpen={isCreateOpen}
        isSubmitting={isSubmitting}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
      />
      <ProjectModal
        title="Edit project"
        project={editingProject}
        isOpen={Boolean(editingProject)}
        isSubmitting={isSubmitting}
        onClose={() => setEditingProject(null)}
        onSubmit={handleUpdate}
      />
      <DeleteProjectModal
        project={deletingProject}
        isDeleting={isSubmitting}
        onCancel={() => setDeletingProject(null)}
        onConfirm={handleDelete}
      />
    </main>
  );
}





