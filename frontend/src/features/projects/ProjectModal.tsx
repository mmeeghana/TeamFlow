import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Project } from './types';

export type ProjectFormValues = {
  name: string;
  description: string;
  themeColor: string;
};

export function ProjectModal({
  title,
  project,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  title: string;
  project?: Project | null;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
}) {
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    defaultValues: { name: '', description: '', themeColor: '#22d3ee' },
  });

  useEffect(() => {
    reset({
      name: project?.name ?? '',
      description: project?.description ?? '',
      themeColor: project?.themeColor ?? '#22d3ee',
    });
  }, [project, reset, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
      <div className="w-full max-w-lg rounded-md border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm font-medium text-slate-200" htmlFor="project-name">
              Name
            </label>
            <input
              id="project-name"
              className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300"
              {...register('name', { required: 'Project name is required.', minLength: 2 })}
            />
            {errors.name ? <p className="mt-2 text-sm text-rose-300">{errors.name.message}</p> : null}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200" htmlFor="project-description">
              Description
            </label>
            <textarea
              id="project-description"
              rows={4}
              className="mt-2 w-full resize-none rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300"
              {...register('description')}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200" htmlFor="theme-color">
              Theme Color
            </label>
            <input
              id="theme-color"
              type="color"
              className="mt-2 h-12 w-20 rounded-md border border-white/10 bg-white/5 p-1"
              {...register('themeColor', { required: true })}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-md border border-white/10 px-4 py-2 text-slate-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-cyan-300 px-4 py-2 font-semibold text-slate-950 disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
