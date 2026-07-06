import { MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { getAuthErrorMessage } from '../auth/form-errors';
import { createComment, deleteComment, getComments, updateComment, type Comment } from './comment-api';
import { formatRelativeTime } from '../../utils/time';

type CommentValues = { content: string };

function renderContent(content: string) {
  return content.split(/(@[\w ]+)/g).map((part, index) =>
    part.startsWith('@') ? (
      <span key={`${part}-${index}`} className="rounded bg-cyan-300/10 px-1 font-medium text-cyan-200">
        {part}
      </span>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}

export function CommentsPanel({
  projectId,
  taskId,
  currentUserId,
  onToast,
  onChanged,
}: {
  projectId: string;
  taskId: string;
  currentUserId: string | undefined;
  onToast: (toast: { type: 'success' | 'error'; message: string }) => void;
  onChanged?: () => Promise<void>;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm<CommentValues>({
    defaultValues: { content: '' },
  });

  const loadComments = useCallback(async () => {
    setIsLoading(true);
    try {
      setComments(await getComments(projectId, taskId));
    } catch (error) {
      onToast({ type: 'error', message: getAuthErrorMessage(error, 'Unable to load comments.') });
    } finally {
      setIsLoading(false);
    }
  }, [onToast, projectId, taskId]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  

  async function onSubmit(values: CommentValues) {
    try {
      if (editingId) {
        await updateComment(projectId, taskId, editingId, values.content);
        onToast({ type: 'success', message: 'Comment updated.' });
      } else {
        await createComment(projectId, taskId, values.content);
        onToast({ type: 'success', message: 'Comment added.' });
      }
      setEditingId(null);
      reset();
      await loadComments();
      await onChanged?.();
    } catch (error) {
      onToast({ type: 'error', message: getAuthErrorMessage(error, 'Unable to save comment.') });
    }
  }

  async function onDelete(commentId: string) {
    try {
      await deleteComment(projectId, taskId, commentId);
      onToast({ type: 'success', message: 'Comment deleted.' });
      await loadComments();
      await onChanged?.();
    } catch (error) {
      onToast({ type: 'error', message: getAuthErrorMessage(error, 'Unable to delete comment.') });
    }
  }

  return (
    <section className="mt-6 border-t border-white/10 pt-6 sm:col-span-2">
      <div className="flex items-center gap-2">
        <MessageSquare size={18} className="text-cyan-300" />
        <h3 className="font-semibold text-white">Comments</h3>
      </div>
      {isLoading ? (
        <div className="mt-4 space-y-3">
          <div className="h-16 animate-pulse rounded-md bg-white/10" />
          <div className="h-16 animate-pulse rounded-md bg-white/10" />
        </div>
      ) : comments.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-400">
          No comments yet
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {comments.map((comment) => (
            <article key={comment.id} className="rounded-md border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{comment.author?.name ?? 'Deleted user'}</p>
                  <p className="text-xs text-slate-500">{formatRelativeTime(comment.createdAt)}</p>
                </div>
                {comment.authorId === currentUserId ? (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setEditingId(comment.id); setValue('content', comment.content); }} className="text-slate-300 hover:text-cyan-200">
                      <Pencil size={15} />
                    </button>
                    <button type="button" onClick={() => void onDelete(comment.id)} className="text-rose-300 hover:text-rose-200">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ) : null}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200">{renderContent(comment.content)}</p>
            </article>
          ))}
        </div>
      )}<form
  className="mt-4 space-y-3"
  onSubmit={(e) => {
    console.log("FORM SUBMITTED");
    handleSubmit(onSubmit)(e);
  }}
>
      
        <textarea
          rows={3}
          placeholder="Write a comment. Mention teammates with @Name"
          className="w-full resize-none rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300"
          {...register('content', { required: true })}
        />
        <div className="flex justify-end gap-2">
          {editingId ? <button type="button" onClick={() => { setEditingId(null); reset(); }} className="rounded-md border border-white/10 px-4 py-2 text-sm text-slate-100">Cancel</button> : null}
          <button disabled={isSubmitting} className="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-70">
            {editingId ? 'Update comment' : 'Add comment'}
          </button>
        </div>
      </form>
    </section>
  );
}


