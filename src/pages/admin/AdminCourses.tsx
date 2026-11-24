import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Archive, BadgeCheck, Eye, Library, MoreHorizontal, Pencil, RotateCcw, Search, SearchX, Send, Trash2, Undo2, XCircle } from 'lucide-react';
import { CourseThumbnail } from '@/components/common/CourseThumbnail';
import { Rating } from '@/components/courses/Rating';
import { CourseStatusBadge } from '@/components/instructor/CourseStatusBadge';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card, ConfirmDialog, Drawer, Dropdown, DropdownItem, EmptyState, ErrorState, Input, Modal, Pagination, Select, Skeleton, Table, Textarea, useToast, type Column } from '@/components/ui';
import { reviewCourse } from '@/features/admin/adminThunks';
import { changeCourseStatus, deleteCourse, fetchCourses, updateCourseDetails } from '@/features/courses/courseSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { COURSE_CATEGORIES, type Course, type CourseLevel } from '@/types';
import { formatCompact, formatCurrency, formatDate, netPrice } from '@/utils/format';

const PAGE_SIZE = 8;
const LEVELS: CourseLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];
type Action = 'approve' | 'publish' | 'unpublish' | 'archive' | 'restore' | 'delete';

const COPY: Record<Action, { title: string; confirm: string; done: string; danger?: boolean; body: (c: Course, enrolled: number) => string }> = {
  approve: { title: 'Approve course?', confirm: 'Approve', done: 'Course approved', body: (c) => `“${c.title}” will be published and become visible to students. The instructor is notified.` },
  publish: { title: 'Publish course?', confirm: 'Publish', done: 'Course published', body: (c) => `“${c.title}” will appear in the student catalogue.` },
  unpublish: { title: 'Unpublish course?', confirm: 'Unpublish', done: 'Course unpublished', body: (c) => `“${c.title}” will be removed from the catalogue and returned to draft. Enrolled students keep access.` },
  archive: { title: 'Archive course?', confirm: 'Archive', done: 'Course archived', body: (c) => `“${c.title}” will be hidden and closed to new enrollments. Enrolled students keep access.` },
  restore: { title: 'Restore course?', confirm: 'Restore', done: 'Course restored', body: (c) => `“${c.title}” will return to draft so it can be edited and republished.` },
  delete: { title: 'Delete course?', confirm: 'Delete', done: 'Course deleted', danger: true, body: (c, n) => `“${c.title}” and its curriculum will be permanently removed${n > 0 ? `, and ${n} enrolled ${n === 1 ? 'student' : 'students'} will lose access` : ''}. This cannot be undone.` },
};

export default function AdminCourses() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [params] = useSearchParams();
  const { items, status, error, curricula } = useAppSelector((s) => s.courses);
  const instructors = useAppSelector((s) => s.instructors.items);
  const enrollments = useAppSelector((s) => s.enrollment.items);

  const [q, setQ] = useState(params.get('q') ?? '');
  const [statusF, setStatusF] = useState(params.get('status') ?? 'all');
  const [category, setCategory] = useState('all');
  const [instructor, setInstructor] = useState('all');
  const [price, setPrice] = useState('all');
  const [rating, setRating] = useState('all');
  const [sort, setSort] = useState('created');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<string | null>(null);
  const [edit, setEdit] = useState<Course | null>(null);
  const [reject, setReject] = useState<Course | null>(null);
  const [pending, setPending] = useState<{ action: Action; course: Course } | null>(null);
  const [busy, setBusy] = useState(false);

  const nameOf = useCallback((id: string): string => instructors.find((i) => i.id === id)?.name ?? 'Unknown', [instructors]);
  const enrolledIn = (id: string): number => enrollments.filter((e) => e.courseId === id && !e.adminStatus).length;

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const by: Record<string, (a: Course, b: Course) => number> = {
      created: (a, b) => b.createdAt.localeCompare(a.createdAt), students: (a, b) => b.studentsCount - a.studentsCount,
      rating: (a, b) => b.rating - a.rating, price: (a, b) => netPrice(b.price, b.discount) - netPrice(a.price, a.discount), title: (a, b) => a.title.localeCompare(b.title),
    };
    return items.filter((c) => {
      const net = netPrice(c.price, c.discount);
      return (!term || c.title.toLowerCase().includes(term) || nameOf(c.instructorId).toLowerCase().includes(term) || c.tags.some((t) => t.includes(term)))
        && (statusF === 'all' || c.status === statusF) && (category === 'all' || c.category === category) && (instructor === 'all' || c.instructorId === instructor)
        && (price === 'all' || (price === 'free' && net === 0) || (price === 'under50' && net > 0 && net < 50) || (price === '50to75' && net >= 50 && net <= 75) || (price === 'over75' && net > 75))
        && (rating === 'all' || (rating === 'none' ? c.rating === 0 : c.rating >= Number(rating)));
    }).sort(by[sort]);
  }, [items, q, statusF, category, instructor, price, rating, sort, nameOf]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const detail = items.find((c) => c.id === view);
  const filtersOn = q !== '' || statusF !== 'all' || category !== 'all' || instructor !== 'all' || price !== 'all' || rating !== 'all';
  const resetFilters = (): void => { setQ(''); setStatusF('all'); setCategory('all'); setInstructor('all'); setPrice('all'); setRating('all'); setPage(1); };

  const run = async (): Promise<void> => {
    if (!pending) return;
    const { action, course } = pending;
    setBusy(true);
    let ok: boolean;
    if (action === 'approve') ok = await dispatch(reviewCourse(course.id, 'approve'));
    else if (action === 'delete') ok = deleteCourse.fulfilled.match(await dispatch(deleteCourse(course.id)));
    else ok = changeCourseStatus.fulfilled.match(await dispatch(changeCourseStatus({ id: course.id, status: action === 'publish' ? 'published' : action === 'archive' ? 'archived' : 'draft' })));
    setBusy(false);
    setPending(null);
    if (ok) toast.success(COPY[action].done, course.title); else toast.error('That did not work', 'Please try again.');
  };

  const columns: Column<Course>[] = [
    { key: 'course', header: 'Course', className: 'min-w-64', cell: (c) => <span className="flex items-center gap-3"><CourseThumbnail src={c.thumbnail} alt="" className="hidden h-12 w-20 shrink-0 rounded-lg sm:block" /><span className="min-w-0"><span className="block truncate font-medium text-fg">{c.title}</span><span className="block truncate text-xs font-normal text-muted">{nameOf(c.instructorId)} · {c.category} · {c.level}</span></span></span> },
    { key: 'price', header: 'Price', cell: (c) => (c.price === 0 ? 'Free' : formatCurrency(netPrice(c.price, c.discount))) },
    { key: 'students', header: 'Students', cell: (c) => formatCompact(c.studentsCount) },
    { key: 'rating', header: 'Rating', cell: (c) => (c.rating > 0 ? <Rating value={c.rating} /> : <span className="text-muted">None</span>) },
    { key: 'lessons', header: 'Lessons', cell: (c) => c.lessonsCount },
    { key: 'status', header: 'Status', cell: (c) => <CourseStatusBadge status={c.status} /> },
    { key: 'created', header: 'Created', cell: (c) => formatDate(c.createdAt) },
    { key: 'actions', header: 'Actions', cell: (c) => (
      <span className="flex items-center gap-1">
        <Button size="sm" variant="outline" leftIcon={<Eye className="h-4 w-4" />} aria-label={`View ${c.title}`} onClick={() => setView(c.id)}>View</Button>
        <Dropdown ariaLabel={`More actions for ${c.title}`} widthClass="w-48" triggerClassName="flex h-8 w-8 items-center justify-center text-muted hover:bg-subtle hover:text-fg" trigger={() => <MoreHorizontal className="h-5 w-5" />}>
          {(close) => (
            <div className="py-1">
              <DropdownItem icon={<Pencil className="h-4 w-4" />} onClick={() => { close(); setEdit(c); }}>Edit</DropdownItem>
              {c.status === 'pending' && <DropdownItem icon={<BadgeCheck className="h-4 w-4" />} onClick={() => { close(); setPending({ action: 'approve', course: c }); }}>Approve</DropdownItem>}
              {c.status === 'pending' && <DropdownItem danger icon={<XCircle className="h-4 w-4" />} onClick={() => { close(); setReject(c); }}>Reject</DropdownItem>}
              {(c.status === 'draft' || c.status === 'rejected') && <DropdownItem icon={<Send className="h-4 w-4" />} onClick={() => { close(); setPending({ action: 'publish', course: c }); }}>Publish</DropdownItem>}
              {c.status === 'published' && <DropdownItem icon={<Undo2 className="h-4 w-4" />} onClick={() => { close(); setPending({ action: 'unpublish', course: c }); }}>Unpublish</DropdownItem>}
              {c.status === 'archived' ? <DropdownItem icon={<RotateCcw className="h-4 w-4" />} onClick={() => { close(); setPending({ action: 'restore', course: c }); }}>Restore</DropdownItem> : <DropdownItem icon={<Archive className="h-4 w-4" />} onClick={() => { close(); setPending({ action: 'archive', course: c }); }}>Archive</DropdownItem>}
              <DropdownItem danger icon={<Trash2 className="h-4 w-4" />} onClick={() => { close(); setPending({ action: 'delete', course: c }); }}>Delete</DropdownItem>
            </div>
          )}
        </Dropdown>
      </span>
    ) },
  ];

  if (status === 'failed') return <ErrorState message={error ?? undefined} onRetry={() => void dispatch(fetchCourses())} />;
  const pendingCount = items.filter((c) => c.status === 'pending').length;

  return (
    <>
      <PageHeader title="Courses" description={pendingCount > 0 ? `${pendingCount} ${pendingCount === 1 ? 'course is' : 'courses are'} waiting for review` : `${items.length} courses in the catalogue`} />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4"><Input type="search" aria-label="Search courses" placeholder="Search by title, instructor or tag" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} leftIcon={<Search className="h-4 w-4" />} /></div>
        <Select aria-label="Filter by status" value={statusF} onChange={(e) => { setStatusF(e.target.value); setPage(1); }} options={[{ value: 'all', label: 'All statuses' }, { value: 'draft', label: 'Draft' }, { value: 'pending', label: 'Pending review' }, { value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }, { value: 'rejected', label: 'Rejected' }]} />
        <Select aria-label="Filter by category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} options={[{ value: 'all', label: 'All categories' }, ...COURSE_CATEGORIES.map((c) => ({ value: c, label: c }))]} />
        <Select aria-label="Filter by instructor" value={instructor} onChange={(e) => { setInstructor(e.target.value); setPage(1); }} options={[{ value: 'all', label: 'All instructors' }, ...instructors.map((i) => ({ value: i.id, label: i.name }))]} />
        <Select aria-label="Filter by price" value={price} onChange={(e) => { setPrice(e.target.value); setPage(1); }} options={[{ value: 'all', label: 'Any price' }, { value: 'free', label: 'Free' }, { value: 'under50', label: 'Under $50' }, { value: '50to75', label: '$50 to $75' }, { value: 'over75', label: 'Over $75' }]} />
        <Select aria-label="Filter by rating" value={rating} onChange={(e) => { setRating(e.target.value); setPage(1); }} options={[{ value: 'all', label: 'Any rating' }, { value: '4.5', label: '4.5 & up' }, { value: '4', label: '4.0 & up' }, { value: 'none', label: 'Not rated' }]} />
        <Select aria-label="Sort courses" value={sort} onChange={(e) => setSort(e.target.value)} options={[{ value: 'created', label: 'Newest' }, { value: 'students', label: 'Most students' }, { value: 'rating', label: 'Highest rated' }, { value: 'price', label: 'Highest price' }, { value: 'title', label: 'Title (A to Z)' }]} />
      </div>
      <Card padded={false} className="p-2 sm:p-4">
        {status !== 'succeeded' ? <div className="space-y-3 p-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-16" />)}</div>
          : rows.length === 0 ? <EmptyState icon={filtersOn ? SearchX : Library} title="No courses found" description="Try changing your search or filters." action={filtersOn ? <Button onClick={resetFilters}>Clear filters</Button> : undefined} />
          : <Table columns={columns} rows={visible} rowKey={(c) => c.id} />}
      </Card>
      <div className="mt-6"><Pagination page={current} totalPages={totalPages} onChange={setPage} /></div>

      <Drawer open={Boolean(detail)} onClose={() => setView(null)} title="Course details" side="right">
        {detail && (
          <div className="space-y-5 p-4">
            <CourseThumbnail src={detail.thumbnail} alt="" className="aspect-video w-full rounded-xl" />
            <div><h3 className="text-lg font-semibold text-fg">{detail.title}</h3><p className="text-sm text-muted">by {nameOf(detail.instructorId)}</p><div className="mt-2"><CourseStatusBadge status={detail.status} /></div></div>
            {detail.status === 'rejected' && detail.rejectionReason && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">Rejected: {detail.rejectionReason}</p>}
            <p className="text-sm leading-relaxed text-muted">{detail.description}</p>
            <dl className="grid grid-cols-2 gap-3 text-sm">{[['Category', detail.category], ['Level', detail.level], ['Price', detail.price === 0 ? 'Free' : formatCurrency(netPrice(detail.price, detail.discount))], ['Language', detail.language], ['Chapters', String(curricula[detail.id]?.length ?? 0)], ['Lessons', String(detail.lessonsCount)], ['Students', formatCompact(detail.studentsCount)], ['Enrolled (live)', String(enrolledIn(detail.id))], ['Created', formatDate(detail.createdAt)], ['Updated', formatDate(detail.updatedAt ?? detail.createdAt)]].map(([l, v]) => <div key={l} className="rounded-xl bg-subtle p-3"><dt className="text-xs text-muted">{l}</dt><dd className="mt-0.5 font-semibold text-fg">{v}</dd></div>)}</dl>
          </div>
        )}
      </Drawer>

      {edit && <EditCourseModal course={edit} saving={busy} onClose={() => setEdit(null)} onSave={async (patch) => { setBusy(true); const r = await dispatch(updateCourseDetails({ id: edit.id, patch })); setBusy(false); if (updateCourseDetails.fulfilled.match(r)) { toast.success('Course updated', patch.title); setEdit(null); } else toast.error('Could not save changes', r.payload); }} />}
      {reject && <RejectModal course={reject} saving={busy} onClose={() => setReject(null)} onReject={async (reason) => { setBusy(true); const ok = await dispatch(reviewCourse(reject.id, 'reject', reason)); setBusy(false); if (ok) { toast.success('Course rejected', reject.title); setReject(null); } else toast.error('Could not reject the course'); }} />}
      {pending && <ConfirmDialog open title={COPY[pending.action].title} confirmLabel={COPY[pending.action].confirm} danger={COPY[pending.action].danger} loading={busy} onConfirm={() => void run()} onClose={() => setPending(null)}>{COPY[pending.action].body(pending.course, enrolledIn(pending.course.id))}</ConfirmDialog>}
    </>
  );
}

function RejectModal({ course, saving, onClose, onReject }: { course: Course; saving: boolean; onClose: () => void; onReject: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string>();
  return (
    <Modal open onClose={saving ? () => undefined : onClose} title="Reject course" description={course.title} size="sm" footer={<><Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button variant="danger" loading={saving} onClick={() => { if (reason.trim().length < 10) { setError('Give the instructor a reason of at least 10 characters.'); return; } onReject(reason.trim()); }}>Reject course</Button></>}>
      <Textarea label="Reason for rejection" rows={4} value={reason} onChange={(e) => { setReason(e.target.value); setError(undefined); }} error={error} hint="The instructor will see this message." />
    </Modal>
  );
}

function EditCourseModal({ course, saving, onClose, onSave }: { course: Course; saving: boolean; onClose: () => void; onSave: (patch: { title: string; category: Course['category']; level: CourseLevel; price: number; discount: number }) => void }) {
  const [form, setForm] = useState({ title: course.title, category: course.category as string, level: course.level as string, price: String(course.price), discount: String(course.discount) });
  const [errors, setErrors] = useState<{ title?: string; price?: string; discount?: string }>({});
  const submit = (): void => {
    const price = Number(form.price);
    const discount = Number(form.discount);
    const found = {
      title: form.title.trim().length < 5 ? 'Enter a title of at least 5 characters.' : undefined,
      price: Number.isNaN(price) || price < 0 || price > 999 ? 'Enter a price between 0 and 999.' : undefined,
      discount: Number.isNaN(discount) || discount < 0 || discount > 90 ? 'Discount must be between 0 and 90%.' : undefined,
    };
    setErrors(found);
    if (found.title || found.price || found.discount) return;
    onSave({ title: form.title.trim(), category: form.category as Course['category'], level: form.level as CourseLevel, price, discount: price === 0 ? 0 : discount });
  };
  return (
    <Modal open onClose={saving ? () => undefined : onClose} title="Edit course" footer={<><Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button onClick={submit} loading={saving}>Save changes</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={errors.title} /></div>
        <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={COURSE_CATEGORIES.map((c) => ({ value: c, label: c }))} />
        <Select label="Level" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} options={LEVELS.map((l) => ({ value: l, label: l }))} />
        <Input label="Price (USD)" type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} error={errors.price} />
        <Input label="Discount (%)" type="number" min={0} max={90} value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} error={errors.discount} />
      </div>
    </Modal>
  );
}
