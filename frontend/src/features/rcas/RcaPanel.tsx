import { FileText, Pencil, Send, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { getAuthErrorMessage } from '../auth/form-errors';
import type { ProjectMember } from '../projects/types';
import type { Task } from '../tasks/types';
import { assignRcaReviewers, createRca, deleteRca, getRcas, submitRca, submitRcaReview, updateRca, type Rca } from './rca-api';

const sectionTitles = ['Timeline', 'Contributing Factors', 'Corrective Actions', 'Preventive Actions'] as const;
type RcaValues = { taskId: string; title: string; summary: string; severity: string; timeline: string; factors: string; corrective: string; preventive: string };
type Toast = { type: 'success' | 'error'; message: string };

function toSections(values: RcaValues) {
  return [
    { title: 'Timeline', content: values.timeline },
    { title: 'Contributing Factors', content: values.factors },
    { title: 'Corrective Actions', content: values.corrective },
    { title: 'Preventive Actions', content: values.preventive },
  ];
}

function statusLabel(status: string) {
  return status === 'IN_REVIEW' ? 'Submitted' : status.charAt(0) + status.slice(1).toLowerCase();
}

export function RcaPanel({ projectId, tasks, members, currentUserId, isOwner, onToast, onChanged }: { projectId: string; tasks: Task[]; members: ProjectMember[]; currentUserId?: string; isOwner: boolean; onToast: (toast: Toast) => void; onChanged?: () => Promise<void> }) {
  const [rcas, setRcas] = useState<Rca[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<Rca | null>(null);
  const [reviewerSelections, setReviewerSelections] = useState<Record<string, string>>({});
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<RcaValues>({ defaultValues: { severity: 'MEDIUM' } });

  const loadRcas = useCallback(async () => {
    setIsLoading(true);
    try { setRcas(await getRcas(projectId)); } catch (error) { onToast({ type: 'error', message: getAuthErrorMessage(error, 'Unable to load RCAs.') }); } finally { setIsLoading(false); }
  }, [onToast, projectId]);

  useEffect(() => { void loadRcas(); }, [loadRcas]);

  function startEdit(rca: Rca) {
    setEditing(rca);
    reset({
      taskId: rca.taskId ?? '', title: rca.title, summary: rca.summary ?? '', severity: rca.severity,
      timeline: rca.sections.find((section) => section.title === 'Timeline')?.content ?? '',
      factors: rca.sections.find((section) => section.title === 'Contributing Factors')?.content ?? '',
      corrective: rca.sections.find((section) => section.title === 'Corrective Actions')?.content ?? '',
      preventive: rca.sections.find((section) => section.title === 'Preventive Actions')?.content ?? '',
    });
  }

  async function saveRca(values: RcaValues) {
    try {
      const payload = { taskId: values.taskId, title: values.title, summary: values.summary || null, severity: values.severity, sections: toSections(values) };
      if (editing) await updateRca(projectId, editing.id, payload); else await createRca(projectId, payload);
      onToast({ type: 'success', message: editing ? 'RCA updated.' : 'RCA created.' });
      setEditing(null); reset({ severity: 'MEDIUM' } as Partial<RcaValues>); await loadRcas(); await onChanged?.();
    } catch (error) { onToast({ type: 'error', message: getAuthErrorMessage(error, 'Unable to save RCA.') }); }
  }

  async function runAction(action: () => Promise<unknown>, message: string) {
    try { await action(); onToast({ type: 'success', message }); await loadRcas(); await onChanged?.(); } catch (error) { onToast({ type: 'error', message: getAuthErrorMessage(error, 'Unable to update RCA.') }); }
  }

  return <section className="mt-8"><div className="grid gap-5 lg:grid-cols-[420px_1fr]"><form onSubmit={handleSubmit(saveRca)} className="rounded-md border border-white/10 bg-white/[0.03] p-5"><div className="flex items-center gap-2"><FileText size={18} className="text-cyan-300" /><h3 className="font-semibold text-white">{editing ? 'Edit RCA' : 'Create RCA'}</h3></div><div className="mt-4 space-y-3"><input placeholder="RCA title" className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white" {...register('title', { required: true })} /><select className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white" {...register('taskId', { required: true })}><option value="">Select task</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select><select className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white" {...register('severity')}><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select><textarea placeholder="Summary" rows={2} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white" {...register('summary')} />{sectionTitles.map((title, index) => <textarea key={title} placeholder={title} rows={2} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white" {...register(['timeline', 'factors', 'corrective', 'preventive'][index] as keyof RcaValues)} />)}<div className="flex justify-end gap-2">{editing ? <button type="button" onClick={() => { setEditing(null); reset({ severity: 'MEDIUM' } as Partial<RcaValues>); }} className="rounded-md border border-white/10 px-3 py-2 text-sm text-slate-100">Cancel</button> : null}<button disabled={isSubmitting} className="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950">Save RCA</button></div></div></form><div className="space-y-4">{isLoading ? <div className="h-32 animate-pulse rounded-md bg-white/10" /> : rcas.length === 0 ? <div className="rounded-md border border-dashed border-white/10 px-6 py-12 text-center text-slate-400">No RCAs yet</div> : rcas.map((rca) => { const myReview = rca.reviews.find((review) => review.reviewerId === currentUserId && review.decision === 'PENDING'); return <article key={rca.id} className="rounded-md border border-white/10 bg-white/[0.03] p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-white">{rca.title}</h3><span className="rounded bg-cyan-300/10 px-2 py-1 text-xs text-cyan-200">{statusLabel(rca.status)}</span><span className="rounded bg-white/10 px-2 py-1 text-xs text-slate-300">{rca.severity}</span></div><p className="mt-2 text-sm text-slate-400">Task: {rca.task?.title ?? 'No task'}</p>{rca.summary ? <p className="mt-2 text-sm text-slate-300">{rca.summary}</p> : null}</div><div className="flex gap-2"><button type="button" onClick={() => startEdit(rca)} className="text-cyan-200"><Pencil size={16} /></button><button type="button" onClick={() => void runAction(() => deleteRca(projectId, rca.id), 'RCA deleted.')} className="text-rose-300"><Trash2 size={16} /></button></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{rca.sections.map((section) => <div key={section.id} className="rounded-md border border-white/10 p-3"><p className="text-sm font-medium text-white">{section.title}</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-400">{section.content || 'Empty'}</p></div>)}</div><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => void runAction(() => submitRca(projectId, rca.id), 'RCA submitted.')} disabled={rca.status !== 'DRAFT'} className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm text-slate-100 disabled:opacity-40"><Send size={15} /> Submit</button>{isOwner && rca.status === 'IN_REVIEW' ? <><select value={reviewerSelections[rca.id] ?? ''} onChange={(event) => setReviewerSelections((current) => ({ ...current, [rca.id]: event.target.value }))} className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Reviewer</option>{members.map((member) => <option key={member.userId} value={member.userId}>{member.user.name}</option>)}</select><button type="button" onClick={() => reviewerSelections[rca.id] && void runAction(() => assignRcaReviewers(projectId, rca.id, [reviewerSelections[rca.id]]), 'Reviewer assigned.')} className="rounded-md border border-white/10 px-3 py-2 text-sm text-slate-100">Assign</button></> : null}</div>{rca.reviews.length ? <div className="mt-4 space-y-2">{rca.reviews.map((review) => <div key={review.id} className="rounded-md bg-white/[0.03] px-3 py-2 text-sm text-slate-300">{review.reviewer?.name ?? 'Reviewer'}: {review.decision}{review.comment ? ` - ${review.comment}` : ''}</div>)}</div> : null}{myReview ? <div className="mt-4 space-y-2"><textarea value={reviewComments[myReview.id] ?? ''} onChange={(event) => setReviewComments((current) => ({ ...current, [myReview.id]: event.target.value }))} placeholder="Review comment required" className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" /><div className="flex gap-2"><button type="button" onClick={() => void runAction(() => submitRcaReview(projectId, rca.id, myReview.id, { decision: 'APPROVED', comment: reviewComments[myReview.id] ?? '' }), 'Review approved.')} className="rounded-md bg-emerald-300 px-3 py-2 text-sm font-semibold text-slate-950">Approve</button><button type="button" onClick={() => void runAction(() => submitRcaReview(projectId, rca.id, myReview.id, { decision: 'REJECTED', comment: reviewComments[myReview.id] ?? '' }), 'Review rejected.')} className="rounded-md bg-rose-300 px-3 py-2 text-sm font-semibold text-slate-950">Reject</button></div></div> : null}</article>; })}</div></div></section>;
}
