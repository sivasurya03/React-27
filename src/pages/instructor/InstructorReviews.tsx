import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { Rating } from '@/components/courses/Rating';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar, Button, buttonStyles, Card, CardHeader, EmptyState, ErrorState, Modal, Select, Skeleton, Textarea, useToast } from '@/components/ui';
import { fetchCourses } from '@/features/courses/courseSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/selectors';
import type { Review } from '@/types';
import { formatDate } from '@/utils/format';

export default function InstructorReviews() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const user = useAppSelector(selectCurrentUser);
  const { items, reviews, status, error } = useAppSelector((state) => state.courses);
  const students = useAppSelector((state) => state.students.items);
  const [courseId, setCourseId] = useState('all');
  const [open, setOpen] = useState<Review | null>(null);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState('');
  const [limit, setLimit] = useState(6);

  const own = useMemo(() => items.filter((c) => c.instructorId === user?.id), [items, user?.id]);
  const list = useMemo(() => {
    const ids = new Set(courseId === 'all' ? own.map((c) => c.id) : [courseId]);
    return reviews.filter((r) => ids.has(r.courseId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [reviews, own, courseId]);
  const average = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;
  const nameOf = (id: string): string => students.find((s) => s.id === id)?.name ?? 'Learner';
  const titleOf = (id: string): string => own.find((c) => c.id === id)?.title ?? 'Course';

  if (status === 'failed') return <ErrorState message={error ?? undefined} onRetry={() => void dispatch(fetchCourses())} />;

  return (
    <>
      <PageHeader title="Reviews" description="What students say about your courses." />
      {status !== 'succeeded' ? <Skeleton className="h-64 rounded-2xl" /> : (
        <>
          <div className="mb-5 max-w-sm"><Select label="Course" value={courseId} onChange={(e) => { setCourseId(e.target.value); setLimit(6); }} options={[{ value: 'all', label: 'All courses' }, ...own.map((c) => ({ value: c.id, label: c.title }))]} /></div>
          {list.length === 0 ? (
            <Card><EmptyState icon={MessageSquare} title="No reviews yet" description="Reviews from students will appear here." action={<Link to="/instructor/courses" className={buttonStyles('primary')}>View my courses</Link>} /></Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              <Card>
                <CardHeader title="Rating summary" />
                <p className="text-5xl font-bold tracking-tight text-fg">{average.toFixed(1)}</p>
                <Rating value={average} className="mt-1" />
                <p className="mt-1 text-sm text-muted">{list.length} {list.length === 1 ? 'review' : 'reviews'}</p>
                <ul className="mt-5 space-y-2" aria-label="Rating distribution">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = list.filter((r) => r.rating === star).length;
                    return <li key={star} className="flex items-center gap-3 text-sm"><span className="w-10 shrink-0 text-muted">{star} star</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-subtle"><div className="h-full rounded-full bg-amber-400" style={{ width: `${(count / list.length) * 100}%` }} /></div><span className="w-5 text-right tabular-nums text-muted">{count}</span></li>;
                  })}
                </ul>
              </Card>
              <Card className="lg:col-span-2">
                <CardHeader title="Recent reviews" />
                <ul className="divide-y divide-line">
                  {list.slice(0, limit).map((r) => (
                    <li key={r.id} className="flex gap-3 py-4">
                      <Avatar name={nameOf(r.studentId)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="font-medium text-fg">{nameOf(r.studentId)}</span><Rating value={r.rating} /><span className="text-xs text-muted">{formatDate(r.createdAt)}</span></div>
                        <p className="text-xs text-muted">{titleOf(r.courseId)}</p>
                        <p className="mt-1.5 line-clamp-2 text-sm text-muted">{r.comment}</p>
                        {replies[r.id] && <p className="mt-2 rounded-lg bg-subtle px-3 py-2 text-sm text-fg"><span className="font-medium">Your reply: </span>{replies[r.id]}</p>}
                        <Button className="mt-2" size="sm" variant="outline" onClick={() => { setOpen(r); setDraft(replies[r.id] ?? ''); }}>View details</Button>
                      </div>
                    </li>
                  ))}
                </ul>
                {list.length > limit && <Button className="mt-2" variant="outline" onClick={() => setLimit((n) => n + 6)}>Show more reviews</Button>}
              </Card>
            </div>
          )}
        </>
      )}

      <Modal open={Boolean(open)} onClose={() => setOpen(null)} title="Review details" description={open ? titleOf(open.courseId) : undefined}
        footer={<><Button variant="outline" onClick={() => setOpen(null)}>Close</Button><Button disabled={!draft.trim()} onClick={() => { if (open) { setReplies((r) => ({ ...r, [open.id]: draft.trim() })); toast.success('Reply saved', 'Replies are demo only and are not shown to students.'); setOpen(null); } }}>Save reply</Button></>}>
        {open && (
          <div className="space-y-4">
            <div className="flex items-center gap-3"><Avatar name={nameOf(open.studentId)} size="lg" /><div><p className="font-semibold text-fg">{nameOf(open.studentId)}</p><p className="text-xs text-muted">{formatDate(open.createdAt)}</p></div></div>
            <Rating value={open.rating} size="md" />
            <p className="text-sm leading-relaxed text-fg">{open.comment}</p>
            <Textarea label="Reply (demo)" rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} hint="Replies stay in this session and are not sent to the student." />
          </div>
        )}
      </Modal>
    </>
  );
}
