import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import type { EventClickArg, EventContentArg, EventDropArg, EventInput, EventMountArg } from '@fullcalendar/core';
import { useMemo } from 'react';
import { taskPriorityLabels, taskStatusLabels } from './task-labels';
import type { Task, TaskStatus } from './types';

const statusColors: Record<TaskStatus, { background: string; border: string; text: string }> = {
  TODO: { background: '#475569', border: '#64748b', text: '#f8fafc' },
  IN_PROGRESS: { background: '#2563eb', border: '#60a5fa', text: '#eff6ff' },
  IN_REVIEW: { background: '#f97316', border: '#fdba74', text: '#fff7ed' },
  DONE: { background: '#16a34a', border: '#86efac', text: '#f0fdf4' },
};

function toDateOnly(value: string) {
  return value.slice(0, 10);
}

function getInitialView() {
  if (typeof window === 'undefined') return 'dayGridMonth';
  return window.matchMedia('(max-width: 767px)').matches ? 'timeGridWeek' : 'dayGridMonth';
}

function renderEventContent(eventInfo: EventContentArg) {
  const task = eventInfo.event.extendedProps.task as Task;

  return (
    <div className="min-w-0 px-1 py-0.5">
      <div className="truncate text-xs font-semibold">{task.title}</div>
      <div className="truncate text-[11px] opacity-90">{task.assignee?.name ?? 'Unassigned'}</div>
    </div>
  );
}

export function TaskCalendar({
  tasks,
  onEventClick,
  onDueDateChange,
}: {
  tasks: Task[];
  onEventClick: (task: Task) => void;
  onDueDateChange: (task: Task, dueDate: string) => Promise<void>;
}) {
  const events = useMemo<EventInput[]>(
    () =>
      tasks
        .filter((task) => task.dueDate)
        .map((task) => {
          const colors = statusColors[task.status];
          const isOverdue = task.status !== 'DONE' && task.dueDate && new Date(task.dueDate) < new Date();

          return {
            id: task.id,
            title: task.title,
            start: toDateOnly(task.dueDate!),
            allDay: true,
            backgroundColor: colors.background,
            borderColor: task.priority === 'CRITICAL' ? '#f43f5e' : isOverdue ? '#f97316' : colors.border,
            textColor: colors.text,
            extendedProps: { task },
            classNames: [task.priority === 'CRITICAL' ? 'teamflow-critical-event' : '', isOverdue ? 'teamflow-overdue-event' : ''],
          } satisfies EventInput;
        }),
    [tasks],
  );

  async function handleEventDrop(eventInfo: EventDropArg) {
    const task = eventInfo.event.extendedProps.task as Task;
    const nextDate = eventInfo.event.startStr;

    try {
      await onDueDateChange(task, nextDate);
    } catch {
      eventInfo.revert();
    }
  }

  function handleEventMount(eventInfo: EventMountArg) {
    const task = eventInfo.event.extendedProps.task as Task;
    eventInfo.el.title = [
      task.title,
      `Status: ${taskStatusLabels[task.status]}`,
      `Priority: ${taskPriorityLabels[task.priority]}`,
      `Estimated Hours: ${task.estimatedHours ?? 0}`,
      `Assignee: ${task.assignee?.name ?? 'Unassigned'}`,
    ].join('\n');
  }

  return (
    <div className="teamflow-calendar rounded-md border border-white/10 bg-white/[0.03] p-3 text-slate-100">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={getInitialView()}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        buttonText={{ today: 'Today', month: 'Month', week: 'Week', day: 'Day' }}
        events={events}
        editable
        eventStartEditable
        eventDurationEditable={false}
        eventClick={(eventInfo: EventClickArg) => onEventClick(eventInfo.event.extendedProps.task as Task)}
        eventDrop={(eventInfo) => void handleEventDrop(eventInfo)}
        eventDidMount={handleEventMount}
        eventContent={renderEventContent}
        dayMaxEvents
        nowIndicator
        height="auto"
      />
    </div>
  );
}

