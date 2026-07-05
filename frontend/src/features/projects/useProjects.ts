import { useCallback, useEffect, useState } from 'react';
import { getProjects } from './project-api';
import type { Project, ProjectsResponse } from './types';

export function useProjects(search: string, page: number) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [meta, setMeta] = useState<ProjectsResponse['meta'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getProjects({ search: search || undefined, page, pageSize: 9 });
      setProjects(response.items);
      setMeta(response.meta);
    } catch {
      setError('Unable to load projects.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  return { projects, meta, isLoading, error, reload: loadProjects };
}
