import { useCallback, useEffect, useState } from 'react';
import { getTasks } from './task-api';
import type { Task, TaskPriority, TasksResponse, TaskStatus } from './types';

export function useTasks(
  projectId: string | undefined,
  filters: { search: string; status: TaskStatus | ''; priority: TaskPriority | ''; assigneeId: string },
  page: number,
  pageSize = 8,
) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meta, setMeta] = useState<TasksResponse['meta'] | null>(null);
  const [stats, setStats] = useState<TasksResponse['stats']>({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    progress: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await getTasks(projectId, {
        search: filters.search || undefined,
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        assigneeId: filters.assigneeId || undefined,
        page,
        pageSize,
      });
      setTasks(response.items);
      setMeta(response.meta);
      setStats(response.stats);
    } catch {
      setError('Unable to load tasks.');
    } finally {
      setIsLoading(false);
    }
  }, [filters.assigneeId, filters.priority, filters.search, filters.status, page, pageSize, projectId]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  return { tasks, meta, stats, isLoading, error, reload: loadTasks };
}



