import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CalendarDays, Clock, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { taskPriorityLabels, taskStatusLabels } from './task-labels';
import type { Task, TaskStatus } from './types';

const columns: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

const priorityStyles = {
  LOW: 'bg-slate-400/10 text-slate-200 border-slate-400/20',
  MEDIUM: 'bg-blue-400/10 text-blue-200 border-blue-400/20',
  HIGH: 'bg-amber-400/10 text-amber-200 border-amber-400/20',
  CRITICAL: 'bg-rose-400/10 text-rose-200 border-rose-400/20',
};

type ReorderPayload = Array<{ id: string; status: TaskStatus; position: number }>;

function groupTasks(tasks: Task[]) {
  return columns.reduce<Record<TaskStatus, Task[]>>(
    (acc, status) => {
      acc[status] = tasks
        .filter((task) => task.status === status)
        .sort((a, b) => a.position - b.position || a.title.localeCompare(b.title));
      return acc;
    },
    { TODO: [], IN_PROGRESS: [], IN_REVIEW: [], DONE: [] },
  );
}

function transformToCss(transform: { x: number; y: number; scaleX?: number; scaleY?: number } | null) {
  if (!transform) return undefined;
  return `translate3d(${transform.x}px, ${transform.y}px, 0) scaleX(${transform.scaleX ?? 1}) scaleY(${transform.scaleY ?? 1})`;
}

function KanbanTaskCard({
  task,
  isOverlay = false,
  onEdit,
}: {
  task: Task;
  isOverlay?: boolean;
  onEdit?: (task: Task) => void;
}) {
  return (
    <article
      className={`rounded-md border border-white/10 bg-slate-900 p-4 shadow-sm ${
        isOverlay ? 'rotate-1 border-cyan-300 shadow-2xl' : 'hover:border-white/20'
      }`}
    >
      <button type="button" onClick={() => onEdit?.(task)} className="block w-full text-left">
        <h3 className="line-clamp-2 text-sm font-semibold text-white">{task.title}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`rounded-full border px-2 py-1 text-xs font-medium ${priorityStyles[task.priority]}`}>
            {taskPriorityLabels[task.priority]}
          </span>
        </div>
        <div className="mt-4 grid gap-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-2">
            <UserRound size={14} />
            {task.assignee?.name ?? 'Unassigned'}
          </span>
          <span className="inline-flex items-center gap-2">
            <CalendarDays size={14} />
            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock size={14} />
            {task.estimatedHours ?? 0}h
          </span>
        </div>
      </button>
    </article>
  );
}

function SortableKanbanTask({ task, onEdit }: { task: Task; onEdit: (task: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: transformToCss(transform), transition }}
      className={isDragging ? 'opacity-40' : ''}
      {...attributes}
      {...listeners}
    >
      <KanbanTaskCard task={task} onEdit={onEdit} />
    </div>
  );
}

function KanbanColumn({
  status,
  tasks,
  isOver,
  onEdit,
}: {
  status: TaskStatus;
  tasks: Task[];
  isOver: boolean;
  onEdit: (task: Task) => void;
}) {
  const { setNodeRef } = useDroppable({ id: status, data: { type: 'column', status } });

  return (
    <section
      ref={setNodeRef}
      className={`flex min-h-[420px] flex-col rounded-md border bg-white/[0.03] transition ${
        isOver ? 'border-cyan-300 bg-cyan-300/10' : 'border-white/10'
      }`}
    >
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">{taskStatusLabels[status]}</h3>
        <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-300">{tasks.length}</span>
      </header>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
          {tasks.length === 0 ? (
            <div className="flex min-h-28 items-center justify-center rounded-md border border-dashed border-white/10 px-4 text-center text-sm text-slate-500">
              Drop tasks here
            </div>
          ) : (
            tasks.map((task) => <SortableKanbanTask key={task.id} task={task} onEdit={onEdit} />)
          )}
        </div>
      </SortableContext>
    </section>
  );
}

export function KanbanBoard({
  tasks,
  onEdit,
  onReorder,
}: {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onReorder: (tasks: ReorderPayload) => Promise<void>;
}) {
  const [localTasks, setLocalTasks] = useState(tasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const groupedTasks = useMemo(() => groupTasks(localTasks), [localTasks]);

  function findTask(taskId: string) {
    return localTasks.find((task) => task.id === taskId) ?? null;
  }

  function getStatusFromOverId(overId: string) {
    if (columns.includes(overId as TaskStatus)) return overId as TaskStatus;
    return findTask(overId)?.status ?? null;
  }

  function handleDragStart(event: DragStartEvent) {
    const task = findTask(String(event.active.id));
    setActiveTask(task);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    setActiveTask(null);
    setOverColumn(null);

    if (!overId || activeId === overId) return;

    const movingTask = findTask(activeId);
    const targetStatus = getStatusFromOverId(overId);
    if (!movingTask || !targetStatus) return;

    const nextGroups = groupTasks(localTasks);
    const sourceStatus = movingTask.status;
    nextGroups[sourceStatus] = nextGroups[sourceStatus].filter((task) => task.id !== activeId);

    const targetTasks = sourceStatus === targetStatus ? nextGroups[sourceStatus] : nextGroups[targetStatus];
    const targetIndex = columns.includes(overId as TaskStatus)
      ? targetTasks.length
      : Math.max(0, targetTasks.findIndex((task) => task.id === overId));
    const updatedTask = { ...movingTask, status: targetStatus };

    if (sourceStatus === targetStatus) {
      const originalIndex = groupedTasks[sourceStatus].findIndex((task) => task.id === activeId);
      const overIndex = groupedTasks[sourceStatus].findIndex((task) => task.id === overId);
      nextGroups[sourceStatus] = arrayMove(groupedTasks[sourceStatus], originalIndex, overIndex).map((task, index) => ({
        ...task,
        position: index,
      }));
    } else {
      nextGroups[targetStatus] = [
        ...targetTasks.slice(0, targetIndex),
        updatedTask,
        ...targetTasks.slice(targetIndex),
      ].map((task, index) => ({ ...task, status: targetStatus, position: index }));
      nextGroups[sourceStatus] = nextGroups[sourceStatus].map((task, index) => ({ ...task, position: index }));
    }

    const nextTasks = columns.flatMap((status) => nextGroups[status]);
    setLocalTasks(nextTasks);

    await onReorder(
      nextTasks.map((task) => ({ id: task.id, status: task.status, position: task.position })),
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      autoScroll
      onDragStart={handleDragStart}
      onDragOver={(event) => setOverColumn(event.over ? getStatusFromOverId(String(event.over.id)) : null)}
      onDragEnd={(event) => void handleDragEnd(event)}
      onDragCancel={() => {
        setActiveTask(null);
        setOverColumn(null);
      }}
    >
      <div className="grid gap-4 xl:grid-cols-4">
        {columns.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={groupedTasks[status]}
            isOver={overColumn === status}
            onEdit={onEdit}
          />
        ))}
      </div>
      <DragOverlay>{activeTask ? <KanbanTaskCard task={activeTask} isOverlay /> : null}</DragOverlay>
    </DndContext>
  );
}
