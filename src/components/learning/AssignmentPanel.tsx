import { useRef, useState } from 'react';
import { CalendarClock, CheckCircle2, Paperclip, Trophy, Upload, X } from 'lucide-react';
import { Badge, Button, Card, Modal, Textarea, useToast, type BadgeVariant } from '@/components/ui';
import type { AssignmentSubmission } from '@/features/learning/learningSlice';
import { formatDate } from '@/utils/format';

const MAX_FILE = 5 * 1024 * 1024;
const MIN_TEXT = 30;

const STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  'not-started': { label: 'Not started', variant: 'neutral' },
  'in-progress': { label: 'In progress', variant: 'info' },
  submitted: { label: 'Submitted', variant: 'warning' },
  reviewed: { label: 'Reviewed', variant: 'success' },
};

interface Props {
  title: string;
  instructions: string[];
  maxScore: number;
  dueAt: string;
  submission?: AssignmentSubmission;
  hasNext: boolean;
  onSaveDraft: (draft: Pick<AssignmentSubmission, 'text' | 'fileName' | 'fileSize'>) => void;
  onSubmit: (draft: Pick<AssignmentSubmission, 'text' | 'fileName' | 'fileSize'>) => void;
  onContinue: () => void;
}

export function AssignmentPanel({ title, instructions, maxScore, dueAt, submission, hasNext, onSaveDraft, onSubmit, onContinue }: Props) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(submission?.text ?? '');
  const [file, setFile] = useState<{ name: string; size: number } | null>(submission?.fileName ? { name: submission.fileName, size: submission.fileSize ?? 0 } : null);
  const [error, setError] = useState<string>();
  const [confirm, setConfirm] = useState(false);

  const status = submission?.status ?? 'not-started';
  const locked = status === 'submitted' || status === 'reviewed';
  const draft = { text: text.trim(), fileName: file?.name, fileSize: file?.size };
  const overdue = !locked && new Date(dueAt).getTime() < Date.now();

  const validate = (): boolean => {
    const problem = text.trim().length < MIN_TEXT && !file ? `Write at least ${MIN_TEXT} characters or attach a file.` : undefined;
    setError(problem);
    return !problem;
  };
  const onFile = (picked?: File): void => {
    if (!picked) return;
    if (picked.size > MAX_FILE) { toast.error('File too large', 'Attachments must be 5 MB or smaller.'); return; }
    setFile({ name: picked.name, size: picked.size });
  };

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-fg">{title}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5"><CalendarClock className="h-4 w-4" aria-hidden />Due {formatDate(dueAt)}{overdue && <Badge variant="danger" className="ml-1">Overdue</Badge>}</span>
            <span className="inline-flex items-center gap-1.5"><Trophy className="h-4 w-4" aria-hidden />Max score {maxScore}</span>
          </p>
        </div>
        <Badge variant={STATUS[status].variant}>{STATUS[status].label}</Badge>
      </div>

      <h3 className="mb-2 mt-5 text-sm font-semibold text-fg">Instructions</h3>
      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted marker:text-muted">{instructions.map((line) => <li key={line}>{line}</li>)}</ol>

      {status === 'reviewed' && submission?.score !== undefined && (
        <div className="mt-5 rounded-xl bg-emerald-500/10 p-4 text-sm">
          <p className="font-semibold text-emerald-800 dark:text-emerald-300">Score: {submission.score} / {maxScore}</p>
          {submission.feedback && <p className="mt-1 text-muted">{submission.feedback}</p>}
        </div>
      )}

      <div className="mt-5 space-y-4">
        <Textarea label="Your response" rows={6} value={text} readOnly={locked} error={error} onChange={(e) => { setText(e.target.value); setError(undefined); }} hint={locked ? undefined : `${text.trim().length} characters (minimum ${MIN_TEXT} unless you attach a file)`} />
        <div>
          <span className="mb-1.5 block text-sm font-medium text-fg">Attachment</span>
          <input ref={fileRef} type="file" className="sr-only" aria-label="Attach a file" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
          {file ? (
            <div className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm"><Paperclip className="h-4 w-4 text-muted" aria-hidden /><span className="min-w-0 flex-1 truncate text-fg">{file.name}</span><span className="text-xs text-muted">{(file.size / 1024).toFixed(0)} KB</span>
              {!locked && <button type="button" onClick={() => setFile(null)} aria-label="Remove attachment" className="rounded p-1 text-muted hover:text-fg"><X className="h-4 w-4" /></button>}</div>
          ) : locked ? <p className="text-sm text-muted">No file attached.</p> : (
            <Button variant="outline" leftIcon={<Upload className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>Choose file (max 5 MB)</Button>
          )}
          <p className="mt-1.5 text-xs text-muted">Only the file name is stored in this demo; the file itself stays on your device.</p>
        </div>
      </div>

      {locked ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-subtle p-4">
          <p className="inline-flex items-center gap-2 text-sm text-fg"><CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden />Submitted on {submission?.submittedAt ? formatDate(submission.submittedAt) : 'earlier'}</p>
          {hasNext && <Button onClick={onContinue}>Continue learning</Button>}
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => { onSaveDraft(draft); toast.success('Draft saved'); }}>Save draft</Button>
          <Button onClick={() => { if (validate()) setConfirm(true); }}>Submit assignment</Button>
        </div>
      )}

      <Modal open={confirm} onClose={() => setConfirm(false)} size="sm" title="Submit assignment?" footer={<><Button variant="outline" onClick={() => setConfirm(false)}>Not yet</Button><Button onClick={() => { setConfirm(false); onSubmit(draft); }}>Submit</Button></>}>
        <p className="text-sm text-muted">You will not be able to edit your response after submitting. This is a frontend demo; no instructor receives it.</p>
      </Modal>
    </Card>
  );
}
