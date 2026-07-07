import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { AlertCircle, Bell, CalendarClock, CheckCircle2, Clock, FolderKanban, ListTodo, UserCheck } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
import { getAuthErrorMessage } from '../auth/form-errors';
import { formatRelativeTime } from '../../utils/time';
import { getDashboardCharts, getDashboardOverview, type DashboardCharts, type DashboardOverview, type DashboardTask } from './dashboard-api';

ChartJS.register(ArcElement, BarElement, CategoryScale, Legend, LinearScale, LineElement, PointElement, Tooltip);

type Toast = { type: 'success' | 'error'; message: string };

type MetricCard = {
  label: string;
  value: number;
  helper: string;
  icon: typeof FolderKanban;
  tone: string;
};

const statusLabels: Record<string, string> = {
  BACKLOG: 'Backlog',
  TODO: 'Todo',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  BLOCKED: 'Blocked',
  DONE: 'Done',
  ARCHIVED: 'Archived',
};

const priorityLabels: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
  URGENT: 'Urgent',
};

const chartColors = ['#22d3ee', '#34d399', '#f59e0b', '#f87171', '#a78bfa', '#60a5fa', '#f472b6'];

const chartOptions = {
  plugins: {
    legend: { labels: { color: '#cbd5e1', boxWidth: 12, boxHeight: 12 } },
  },
  scales: {
    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.12)' } },
    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.12)' } },
  },
  maintainAspectRatio: false,
};

const radialOptions = {
  plugins: {
    legend: { position: 'bottom' as const, labels: { color: '#cbd5e1', boxWidth: 12, boxHeight: 12 } },
  },
  maintainAspectRatio: false,
};

function formatAction(action: string) {
  return action
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDate(value: string | null) {
  if (!value) return 'No due date';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-md bg-white/10" />)}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-80 animate-pulse rounded-md bg-white/10" />)}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-md border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">{message}</div>;
}

function TaskList({ tasks, emptyMessage }: { tasks: DashboardTask[]; emptyMessage: string }) {
  if (tasks.length === 0) return <EmptyState message={emptyMessage} />;

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <article key={task.id} className="rounded-md border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{task.title}</p>
              <p className="mt-1 truncate text-xs text-slate-500">{task.project.name}</p>
            </div>
            <span className="shrink-0 rounded bg-cyan-300/10 px-2 py-1 text-xs text-cyan-200">{priorityLabels[task.priority] ?? task.priority}</span>
          </div>
          <p className="mt-3 text-xs text-slate-400">{statusLabels[task.status] ?? task.status} • {formatDate(task.dueDate)}</p>
        </article>
      ))}
    </div>
  );
}

export const DashboardAnalytics = memo(function DashboardAnalytics({ onToast }: { onToast: (toast: Toast) => void }) {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextOverview, nextCharts] = await Promise.all([getDashboardOverview(), getDashboardCharts()]);
      setOverview(nextOverview);
      setCharts(nextCharts);
    } catch (loadError) {
      const message = getAuthErrorMessage(loadError, 'Unable to load dashboard analytics.');
      setError(message);
      onToast({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const metrics = useMemo<MetricCard[]>(() => {
    if (!overview) return [];
    return [
      { label: 'Total Projects', value: overview.totalProjects, helper: `${overview.totalActiveProjects} active`, icon: FolderKanban, tone: 'text-cyan-300' },
      { label: 'Total Tasks', value: overview.totalTasks, helper: `${overview.tasksCreatedThisWeek} created this week`, icon: ListTodo, tone: 'text-sky-300' },
      { label: 'Completed', value: overview.completedTasks, helper: 'Done tasks', icon: CheckCircle2, tone: 'text-emerald-300' },
      { label: 'Pending', value: overview.pendingTasks, helper: 'Still in motion', icon: Clock, tone: 'text-amber-300' },
      { label: 'Overdue', value: overview.overdueTasks, helper: 'Need attention', icon: AlertCircle, tone: 'text-rose-300' },
      { label: 'Assigned To Me', value: overview.assignedToMe, helper: `${overview.unreadNotifications} unread alerts`, icon: UserCheck, tone: 'text-violet-300' },
    ];
  }, [overview]);

  const statusData = useMemo(() => ({
    labels: charts?.tasksByStatus.map((item) => statusLabels[item.status] ?? item.status) ?? [],
    datasets: [{ data: charts?.tasksByStatus.map((item) => item.count) ?? [], backgroundColor: chartColors }],
  }), [charts]);

  const priorityData = useMemo(() => ({
    labels: charts?.tasksByPriority.map((item) => priorityLabels[item.priority] ?? item.priority) ?? [],
    datasets: [{ data: charts?.tasksByPriority.map((item) => item.count) ?? [], backgroundColor: chartColors.slice().reverse() }],
  }), [charts]);

  const completedData = useMemo(() => ({
    labels: charts?.completedPerWeek.map((item) => item.label) ?? [],
    datasets: [{ label: 'Completed', data: charts?.completedPerWeek.map((item) => item.count) ?? [], backgroundColor: '#22d3ee', borderRadius: 4 }],
  }), [charts]);

  const projectsData = useMemo(() => ({
    labels: charts?.projectsCreatedPerMonth.map((item) => item.label) ?? [],
    datasets: [{ label: 'Projects', data: charts?.projectsCreatedPerMonth.map((item) => item.count) ?? [], borderColor: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.18)', tension: 0.35, fill: true }],
  }), [charts]);

  const workloadData = useMemo(() => ({
    labels: charts?.memberWorkload.map((item) => item.assignee?.name ?? 'Unknown') ?? [],
    datasets: [{ label: 'Open tasks', data: charts?.memberWorkload.map((item) => item.count) ?? [], backgroundColor: '#a78bfa', borderRadius: 4 }],
  }), [charts]);

  if (isLoading) return <DashboardSkeleton />;

  if (error || !overview || !charts) {
    return (
      <div className="rounded-md border border-rose-300/20 bg-rose-300/10 p-5 text-sm text-rose-100">
        {error ?? 'Dashboard analytics are unavailable.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article key={metric.label} className="rounded-md border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-400">{metric.label}</p>
                <Icon size={18} className={metric.tone} />
              </div>
              <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
              <p className="mt-1 text-xs text-slate-500">{metric.helper}</p>
            </article>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-md border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-semibold text-white">Tasks by Status</h3>
          <div className="mt-4 h-72">{charts.tasksByStatus.some((item) => item.count > 0) ? <Pie data={statusData} options={radialOptions} /> : <EmptyState message="No task status data yet" />}</div>
        </section>
        <section className="rounded-md border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-semibold text-white">Tasks by Priority</h3>
          <div className="mt-4 h-72">{charts.tasksByPriority.some((item) => item.count > 0) ? <Doughnut data={priorityData} options={radialOptions} /> : <EmptyState message="No priority data yet" />}</div>
        </section>
        <section className="rounded-md border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-semibold text-white">Weekly Completed Tasks</h3>
          <div className="mt-4 h-72"><Bar data={completedData} options={chartOptions} /></div>
        </section>
        <section className="rounded-md border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-semibold text-white">Projects Created</h3>
          <div className="mt-4 h-72"><Line data={projectsData} options={chartOptions} /></div>
        </section>
        <section className="rounded-md border border-white/10 bg-white/[0.03] p-5 lg:col-span-2">
          <h3 className="font-semibold text-white">Member Workload</h3>
          <div className="mt-4 h-72">
            {charts.memberWorkload.length > 0 ? <Bar data={workloadData} options={{ ...chartOptions, indexAxis: 'y' as const }} /> : <EmptyState message="No assigned open tasks yet" />}
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        <section className="rounded-md border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center gap-2"><Clock size={17} className="text-cyan-300" /><h3 className="font-semibold text-white">Recent Activity</h3></div>
          {overview.recentActivity.length === 0 ? <EmptyState message="No recent activity" /> : (
            <div className="space-y-3">
              {overview.recentActivity.map((item) => <article key={item.id} className="border-b border-white/10 pb-3 last:border-0 last:pb-0"><p className="text-sm text-white">{formatAction(item.action)}</p><p className="mt-1 text-xs text-slate-400">{item.actor?.name ?? 'System'} • {item.project.name}</p><p className="mt-1 text-xs text-slate-500">{formatRelativeTime(item.createdAt)}</p></article>)}
            </div>
          )}
        </section>
        <section className="rounded-md border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center gap-2"><CalendarClock size={17} className="text-amber-300" /><h3 className="font-semibold text-white">Upcoming Due</h3></div>
          <TaskList tasks={overview.upcomingDueTasks} emptyMessage="No upcoming due tasks" />
        </section>
        <section className="rounded-md border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center gap-2"><UserCheck size={17} className="text-violet-300" /><h3 className="font-semibold text-white">Recently Assigned</h3></div>
          <TaskList tasks={overview.recentlyAssignedTasks} emptyMessage="No assigned tasks yet" />
        </section>
        <section className="rounded-md border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center gap-2"><Bell size={17} className="text-cyan-300" /><h3 className="font-semibold text-white">Recent Notifications</h3></div>
          {overview.recentNotifications.length === 0 ? <EmptyState message="No notifications yet" /> : (
            <div className="space-y-3">
              {overview.recentNotifications.map((item) => <article key={item.id} className="border-b border-white/10 pb-3 last:border-0 last:pb-0"><p className="text-sm font-medium text-white">{item.title}</p><p className="mt-1 line-clamp-2 text-xs text-slate-400">{item.message}</p><p className="mt-1 text-xs text-slate-500">{formatRelativeTime(item.createdAt)}</p></article>)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
});
