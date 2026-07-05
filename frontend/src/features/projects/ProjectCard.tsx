import { CalendarDays, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Project } from './types';

export function ProjectCard({
  project,
  onEdit,
  onDelete,
  canManage,
}: {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  canManage: boolean;
}) {
  return (
    <article className="rounded-md border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20">
      <Link to={`/projects/${project.id}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 h-2 w-16 rounded-full" style={{ backgroundColor: project.themeColor }} />
            <h2 className="truncate text-lg font-semibold text-white">{project.name}</h2>
            <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-slate-300">
              {project.description || 'No description yet.'}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-400">
          <span className="inline-flex items-center gap-2">
            <Users size={16} />
            {project._count.members} members
          </span>
          <span className="inline-flex items-center gap-2">
            <CalendarDays size={16} />
            {new Date(project.createdAt).toLocaleDateString()}
          </span>
        </div>
      </Link>
      {canManage ? (
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(project)}
            className="rounded-md border border-white/10 px-3 py-2 text-sm font-medium text-slate-100 hover:border-cyan-300 hover:text-cyan-200"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(project)}
            className="rounded-md border border-rose-400/30 px-3 py-2 text-sm font-medium text-rose-200 hover:bg-rose-400/10"
          >
            Delete
          </button>
        </div>
      ) : null}
    </article>
  );
}
