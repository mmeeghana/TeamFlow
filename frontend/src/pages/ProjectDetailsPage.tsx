import { ArrowLeft, Plus, Trash2, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { Toast, type ToastState } from '../components/Toast';
import { getAuthErrorMessage } from '../features/auth/form-errors';
import { inviteProjectMember, getProject, removeProjectMember } from '../features/projects/project-api';
import type { Project } from '../features/projects/types';
import { useAuth } from '../features/auth/useAuth';

type InviteValues = { email: string };

export function ProjectDetailsPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <Toast toast={toast} />
      <section className="mx-auto max-w-6xl px-6 py-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-cyan-300">
          <ArrowLeft size={16} /> Projects
        </Link>
        {isLoading ? (
          <p className="mt-10 text-slate-300">Loading project...</p>
        ) : project ? (
          <div className="mt-8">
            <div className="h-2 w-20 rounded-full" style={{ backgroundColor: project.themeColor }} />
            <h1 className="mt-5 text-4xl font-semibold tracking-normal">{project.name}</h1>
            <p className="mt-4 max-w-3xl text-slate-300">{project.description || 'No description yet.'}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-md border border-white/10 p-5">
                <p className="text-sm text-slate-400">Members</p>
                <p className="mt-2 text-3xl font-semibold">{project._count.members}</p>
              </div>
              <div className="rounded-md border border-white/10 p-5">
                <p className="text-sm text-slate-400">Tasks</p>
                <p className="mt-2 text-3xl font-semibold">{project._count.tasks}</p>
              </div>
              <div className="rounded-md border border-white/10 p-5">
                <p className="text-sm text-slate-400">Recent activity</p>
                <p className="mt-2 text-3xl font-semibold">{project._count.activityLogs}</p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-md bg-cyan-300 px-4 py-2 font-semibold text-slate-950">
                <Plus size={16} /> Create Task
              </button>
            </div>
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
          </div>
        ) : (
          <p className="mt-10 text-slate-300">Project not found.</p>
        )}
      </section>
    </main>
  );
}
