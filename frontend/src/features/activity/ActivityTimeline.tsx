import { Activity } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { getAuthErrorMessage } from '../auth/form-errors';
import { getProjectActivity, type ActivityLog } from './activity-api';
import { formatRelativeTime } from '../../utils/time';

function metadataValue(metadata: Record<string, unknown> | null, key: string) {
  const value = metadata?.[key];
  return typeof value === 'string' ? value : null;
}

function actionText(item: ActivityLog) {
  const actor = item.actor?.name ?? 'Someone';
  const from = metadataValue(item.metadata, 'from');
  const to = metadataValue(item.metadata, 'to');
  const taskTitle = item.task?.title ?? metadataValue(item.metadata, 'taskTitle') ?? 'a task';

  switch (item.action) {
    case 'PROJECT_CREATED':
      return `${actor} created the project`;
    case 'MEMBER_INVITED':
      return `${actor} invited a member`;
    case 'MEMBER_REMOVED':
      return `${actor} removed a member`;
    case 'TASK_CREATED':
      return `${actor} created ${taskTitle}`;
    case 'TASK_UPDATED':
      return `${actor} updated ${taskTitle}`;
    case 'STATUS_CHANGED':
      return `${actor} changed status from ${from ?? 'previous'} to ${to ?? 'new'}`;
    case 'PRIORITY_CHANGED':
      return `${actor} changed priority from ${from ?? 'previous'} to ${to ?? 'new'}`;
    case 'DUE_DATE_CHANGED':
      return `${actor} changed the due date`;
    case 'ASSIGNEE_CHANGED':
      return `${actor} changed the assignee`;
    case 'COMMENT_ADDED':
      return `${actor} commented on ${taskTitle}`;
    case 'COMMENT_EDITED':
      return `${actor} edited a comment`;
    case 'COMMENT_DELETED':
      return `${actor} deleted a comment`;
    default:
      return `${actor} updated the project`;
  }
}

export function ActivityTimeline({
  projectId,
  refreshKey,
  onToast,
}: {
  projectId: string;
  refreshKey: number;
  onToast: (toast: { type: 'success' | 'error'; message: string }) => void;
}) {
  const [items, setItems] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadActivity = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getProjectActivity(projectId, 1, 20);
      setItems(response.items);
    } catch (error) {
      onToast({ type: 'error', message: getAuthErrorMessage(error, 'Unable to load activity.') });
    } finally {
      setIsLoading(false);
    }
  }, [onToast, projectId]);

  useEffect(() => {
    void loadActivity();
  }, [loadActivity, refreshKey]);

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2">
        <Activity size={18} className="text-cyan-300" />
        <h2 className="text-xl font-semibold">Activity Timeline</h2>
      </div>
      {isLoading ? (
        <div className="mt-5 space-y-3">
          <div className="h-14 animate-pulse rounded-md bg-white/10" />
          <div className="h-14 animate-pulse rounded-md bg-white/10" />
          <div className="h-14 animate-pulse rounded-md bg-white/10" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-5 rounded-md border border-dashed border-white/10 px-6 py-8 text-center text-sm text-slate-400">
          No activity yet
        </div>
      ) : (
        <div className="mt-5 divide-y divide-white/10 rounded-md border border-white/10">
          {items.map((item) => (
            <article key={item.id} className="flex gap-3 px-4 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-300/10 text-sm font-semibold text-cyan-200">
                {item.actor?.name?.slice(0, 1).toUpperCase() ?? '?'}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-slate-100">{actionText(item)}</p>
                <p className="mt-1 text-xs text-slate-500">{formatRelativeTime(item.createdAt)}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}


