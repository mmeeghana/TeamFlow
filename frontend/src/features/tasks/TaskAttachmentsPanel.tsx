import {
  Download,
  FileArchive,
  FileText,
  FileType,
  Image as ImageIcon,
  Paperclip,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAuthErrorMessage } from '../auth/form-errors';
import { formatRelativeTime } from '../../utils/time';
import {
  deleteAttachment,
  downloadAttachment,
  getAttachments,
  uploadAttachment,
  type TaskAttachment,
} from './attachment-api';

const maxFileSize = 10 * 1024 * 1024;
const allowedExtensions = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'gif', 'txt', 'zip'];

type Toast = { type: 'success' | 'error' | 'warning'; message: string };

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getExtension(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

function getFileIcon(attachment: TaskAttachment) {
  const extension = getExtension(attachment.originalName);
  if (attachment.mimeType.startsWith('image/')) return <ImageIcon size={18} className="text-emerald-300" />;
  if (extension === 'pdf') return <FileText size={18} className="text-rose-300" />;
  if (extension === 'doc' || extension === 'docx') return <FileType size={18} className="text-sky-300" />;
  if (extension === 'zip') return <FileArchive size={18} className="text-amber-300" />;
  return <Paperclip size={18} className="text-cyan-300" />;
}

function isAllowedFile(file: File) {
  const extension = getExtension(file.name);
  return allowedExtensions.includes(extension) && file.size <= maxFileSize;
}

export function TaskAttachmentsPanel({
  projectId,
  taskId,
  currentUserId,
  projectOwnerId,
  onToast,
  onChanged,
}: {
  projectId: string;
  taskId: string;
  currentUserId: string | undefined;
  projectOwnerId: string | undefined;
  onToast: (toast: Toast) => void;
  onChanged?: () => Promise<void>;
}) {
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  const accept = useMemo(() => allowedExtensions.map((extension) => `.${extension}`).join(','), []);

  const loadAttachments = useCallback(async () => {
    setIsLoading(true);
    try {
      setAttachments(await getAttachments(projectId, taskId));
    } catch (error) {
      onToast({ type: 'error', message: getAuthErrorMessage(error, 'Unable to load attachments.') });
    } finally {
      setIsLoading(false);
    }
  }, [onToast, projectId, taskId]);

  useEffect(() => {
    void loadAttachments();
  }, [loadAttachments]);


  useEffect(() => {
    let isMounted = true;
    const urls: string[] = [];

    async function loadPreviews() {
      const imageAttachments = attachments.filter((attachment) => attachment.mimeType.startsWith('image/'));
      const entries = await Promise.all(
        imageAttachments.map(async (attachment) => {
          try {
            const blob = await downloadAttachment(projectId, taskId, attachment.id);
            const url = URL.createObjectURL(blob);
            urls.push(url);
            return [attachment.id, url] as const;
          } catch {
            return null;
          }
        }),
      );

      if (isMounted) {
        setPreviewUrls(Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry !== null)));
      }
    }

    void loadPreviews();

    return () => {
      isMounted = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [attachments, projectId, taskId]);
  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0 || uploadProgress !== null) return;

    for (const file of files) {
      if (!isAllowedFile(file)) {
        onToast({ type: 'error', message: `${file.name} is not a supported file or is larger than 10MB.` });
        continue;
      }

      try {
        setUploadProgress(0);
        await uploadAttachment(projectId, taskId, file, (progress) => setUploadProgress(progress));
        onToast({ type: 'success', message: 'Attachment uploaded.' });
        await loadAttachments();
        await onChanged?.();
      } catch (error) {
        onToast({ type: 'error', message: getAuthErrorMessage(error, 'Unable to upload attachment.') });
      } finally {
        setUploadProgress(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  }


  async function onDownload(attachment: TaskAttachment) {
    try {
      const blob = await downloadAttachment(projectId, taskId, attachment.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.originalName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      onToast({ type: 'error', message: getAuthErrorMessage(error, 'Unable to download attachment.') });
    }
  }
  async function onDelete(attachmentId: string) {
    try {
      await deleteAttachment(projectId, taskId, attachmentId);
      onToast({ type: 'success', message: 'Attachment deleted.' });
      await loadAttachments();
      await onChanged?.();
    } catch (error) {
      onToast({ type: 'error', message: getAuthErrorMessage(error, 'Unable to delete attachment.') });
    }
  }

  return (
    <section className="mt-6 border-t border-white/10 pt-6 sm:col-span-2">
      <div className="flex items-center gap-2">
        <Paperclip size={18} className="text-cyan-300" />
        <h3 className="font-semibold text-white">Attachments</h3>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void handleFiles(event.dataTransfer.files);
        }}
        className={`mt-4 rounded-md border border-dashed px-4 py-5 transition ${
          isDragging ? 'border-cyan-300 bg-cyan-300/10' : 'border-white/15 bg-white/[0.03]'
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-cyan-300/10 text-cyan-200">
              <UploadCloud size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">Drop files here</p>
              <p className="mt-1 text-xs text-slate-400">PDF, Word, images, text, and ZIP up to 10MB</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadProgress !== null}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-70"
          >
            <UploadCloud size={16} /> Upload
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(event) => {
            if (event.target.files) void handleFiles(event.target.files);
          }}
        />
        {uploadProgress !== null ? (
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-cyan-300 transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          <div className="h-16 animate-pulse rounded-md bg-white/10" />
          <div className="h-16 animate-pulse rounded-md bg-white/10" />
        </div>
      ) : attachments.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-400">
          No attachments yet
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {attachments.map((attachment) => {
            const canDelete = attachment.uploadedById === currentUserId || projectOwnerId === currentUserId;
            const previewUrl = previewUrls[attachment.id];
            return (
              <article key={attachment.id} className="flex flex-col gap-3 rounded-md border border-white/10 bg-white/[0.03] p-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {attachment.mimeType.startsWith('image/') ? (
                    <img
                      src={previewUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-md border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5">
                      {getFileIcon(attachment)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{attachment.originalName}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatFileSize(attachment.size)} � {formatRelativeTime(attachment.uploadedAt)}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {attachment.uploadedBy?.name ?? 'Deleted user'}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => void onDownload(attachment)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-slate-200 hover:text-cyan-200"
                    aria-label={`Download ${attachment.originalName}`}
                  >
                    <Download size={16} />
                  </button>
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => void onDelete(attachment.id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-rose-300 hover:text-rose-200"
                      aria-label={`Delete ${attachment.originalName}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}



