import { Bell } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getAuthErrorMessage } from '../auth/form-errors';
import { getNotifications, markAllNotificationsRead, markNotificationRead, type NotificationItem } from './notification-api';
import { formatRelativeTime } from '../../utils/time';

export function NotificationBell({
  onToast,
}: {
  onToast?: (toast: { type: 'success' | 'error'; message: string }) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getNotifications(1, 10);
      setItems(response.items);
      setUnreadCount(response.unreadCount);
    } catch (error) {
      onToast?.({ type: 'error', message: getAuthErrorMessage(error, 'Unable to load notifications.') });
    } finally {
      setIsLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, []);

  async function onMarkRead(id: string) {
    try {
      await markNotificationRead(id);
      await loadNotifications();
      onToast?.({ type: 'success', message: 'Notification marked as read.' });
    } catch (error) {
      onToast?.({ type: 'error', message: getAuthErrorMessage(error, 'Unable to update notification.') });
    }
  }

  async function onMarkAllRead() {
    try {
      await markAllNotificationsRead();
      await loadNotifications();
      onToast?.({ type: 'success', message: 'All notifications marked as read.' });
    } catch (error) {
      onToast?.({ type: 'error', message: getAuthErrorMessage(error, 'Unable to update notifications.') });
    }
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-slate-100 transition hover:border-cyan-300 hover:text-cyan-200"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-rose-400 px-1.5 py-0.5 text-center text-xs font-bold text-slate-950">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>
      {isOpen ? (
        <div className="absolute right-0 z-50 mt-3 w-[min(24rem,calc(100vw-2rem))] rounded-md border border-white/10 bg-slate-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h2 className="font-semibold text-white">Notifications</h2>
            <button type="button" onClick={() => void onMarkAllRead()} className="text-xs font-medium text-cyan-300 hover:text-cyan-200">
              Mark all read
            </button>
          </div>
          {isLoading ? (
            <div className="space-y-3 p-4">
              <div className="h-14 animate-pulse rounded bg-white/10" />
              <div className="h-14 animate-pulse rounded bg-white/10" />
              <div className="h-14 animate-pulse rounded bg-white/10" />
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">No notifications yet</div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {items.map((item) => (
                <article key={item.id} className="border-b border-white/10 px-4 py-3 last:border-b-0">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.readAt ? 'bg-slate-600' : 'bg-cyan-300'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-300">{item.message}</p>
                      <p className="mt-2 text-xs text-slate-500">{formatRelativeTime(item.createdAt)}</p>
                    </div>
                    {!item.readAt ? (
                      <button type="button" onClick={() => void onMarkRead(item.id)} className="text-xs font-medium text-cyan-300 hover:text-cyan-200">
                        Read
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}



