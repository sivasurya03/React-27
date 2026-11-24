import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Ban, ClipboardList, Eye, MoreHorizontal, RotateCcw, Search, SearchX, Undo2 } from 'lucide-react';
import { CompletionBadge, PaymentBadge } from '@/components/admin/AdminBadges';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card, ConfirmDialog, Drawer, Dropdown, DropdownItem, EmptyState, ErrorState, Input, Pagination, ProgressBar, Select, Skeleton, Table, useToast, type Column } from '@/components/ui';
import { setAdminStatus } from '@/features/enrollment/enrollmentSlice';
import { addNotification } from '@/features/notifications/notificationSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { buildEnrollmentRows, type EnrollmentRow } from '@/utils/adminInsights';
import { formatCurrency, formatDate } from '@/utils/format';

const PAGE_SIZE = 10;
type Action = 'cancel' | 'refund' | 'reinstate';
const COPY: Record<Action, { title: string; confirm: string; done: string; danger?: boolean; body: (r: EnrollmentRow) => string }> = {
  cancel: { title: 'Cancel enrollment?', confirm: 'Cancel enrollment', done: 'Enrollment cancelled', danger: true, body: (r) => `${r.studentName} will lose access to “${r.courseTitle}”. Their progress is kept so you can reinstate it later.` },
  refund: { title: 'Refund this payment?', confirm: 'Refund', done: 'Payment refunded', danger: true, body: (r) => `${formatCurrency(r.amount)} will be refunded to ${r.studentName} and their access to “${r.courseTitle}” will be removed. (Demo: no money moves.)` },
  reinstate: { title: 'Reinstate enrollment?', confirm: 'Reinstate', done: 'Enrollment reinstated', body: (r) => `${r.studentName} will regain access to “${r.courseTitle}”.` },
};

export default function AdminEnrollments() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [params] = useSearchParams();
  const courses = useAppSelector((s) => s.courses);
  const students = useAppSelector((s) => s.students);
  const instructors = useAppSelector((s) => s.instructors.items);
  const enrollments = useAppSelector((s) => s.enrollment.items);

  const [q, setQ] = useState(params.get('q') ?? '');
  const [course, setCourse] = useState('all');
  const [instructor, setInstructor] = useState('all');
  const [payment, setPayment] = useState('all');
  const [completion, setCompletion] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState('date');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<string | null>(null);
  const [pending, setPending] = useState<{ action: Action; row: EnrollmentRow } | null>(null);

  const all = useMemo(() => buildEnrollmentRows(enrollments, courses.items, students.items, instructors), [enrollments, courses.items, students.items, instructors]);
  const invalidRange = Boolean(from && to && from > to);
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const start = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity;
    const end = to ? new Date(`${to}T23:59:59`).getTime() : Infinity;
    return all.filter((r) => {
      const t = new Date(r.enrolledAt).getTime();
      return (!term || r.id.toLowerCase().includes(term) || r.studentName.toLowerCase().includes(term) || r.courseTitle.toLowerCase().includes(term) || r.instructorName.toLowerCase().includes(term))
        && (course === 'all' || r.courseId === course) && (instructor === 'all' || r.instructorId === instructor) && (payment === 'all' || r.payment === payment) && (completion === 'all' || r.completion === completion)
        && (invalidRange || (t >= start && t <= end));
    }).sort((a, b) => sort === 'progress' ? b.progress - a.progress : sort === 'amount' ? b.amount - a.amount : b.enrolledAt.localeCompare(a.enrolledAt));
  }, [all, q, course, instructor, payment, completion, from, to, sort, invalidRange]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const detail = all.find((r) => r.id === view);
  const filtersOn = q !== '' || course !== 'all' || instructor !== 'all' || payment !== 'all' || completion !== 'all' || from !== '' || to !== '';
  const reset = (): void => { setQ(''); setCourse('all'); setInstructor('all'); setPayment('all'); setCompletion('all'); setFrom(''); setTo(''); setPage(1); };

  const run = (): void => {
    if (!pending) return;
    const { action, row } = pending;
    dispatch(setAdminStatus({ id: row.id, adminStatus: action === 'cancel' ? 'cancelled' : action === 'refund' ? 'refunded' : undefined }));
    if (action === 'refund') dispatch(addNotification({ type: 'system', audience: 'admin', title: 'Refund processed', message: `${formatCurrency(row.amount)} refunded to ${row.studentName} for ${row.courseTitle} (demo).` }));
    toast.success(COPY[action].done, `${row.studentName} · ${row.courseTitle}`);
    setPending(null);
  };

  const columns: Column<EnrollmentRow>[] = [
    { key: 'id', header: 'Enrollment', cell: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: 'student', header: 'Student', cell: (r) => r.studentName },
    { key: 'course', header: 'Course', className: 'min-w-48', cell: (r) => <span className="line-clamp-2">{r.courseTitle}</span> },
    { key: 'instructor', header: 'Instructor', cell: (r) => r.instructorName },
    { key: 'date', header: 'Enrolled', cell: (r) => formatDate(r.enrolledAt) },
    { key: 'progress', header: 'Progress', className: 'min-w-28', cell: (r) => <ProgressBar value={r.progress} showLabel size="sm" label={`${r.studentName} progress`} /> },
    { key: 'completion', header: 'Status', cell: (r) => <CompletionBadge status={r.completion} /> },
    { key: 'payment', header: 'Payment', cell: (r) => <PaymentBadge status={r.payment} /> },
    { key: 'amount', header: 'Amount', cell: (r) => formatCurrency(r.amount) },
    { key: 'actions', header: 'Actions', cell: (r) => (
      <span className="flex items-center gap-1">
        <Button size="sm" variant="outline" leftIcon={<Eye className="h-4 w-4" />} aria-label={`View enrollment ${r.id}`} onClick={() => setView(r.id)}>View</Button>
        <Dropdown ariaLabel={`More actions for enrollment ${r.id}`} widthClass="w-52" triggerClassName="flex h-8 w-8 items-center justify-center text-muted hover:bg-subtle hover:text-fg" trigger={() => <MoreHorizontal className="h-5 w-5" />}>
          {(close) => (
            <div className="py-1">
              {(r.completion === 'active' || r.completion === 'completed') && <DropdownItem danger icon={<Ban className="h-4 w-4" />} onClick={() => { close(); setPending({ action: 'cancel', row: r }); }}>Cancel enrollment</DropdownItem>}
              {r.payment === 'paid' && r.completion !== 'refunded' && <DropdownItem danger icon={<Undo2 className="h-4 w-4" />} onClick={() => { close(); setPending({ action: 'refund', row: r }); }}>Refund payment</DropdownItem>}
              {r.completion === 'cancelled' && <DropdownItem icon={<RotateCcw className="h-4 w-4" />} onClick={() => { close(); setPending({ action: 'reinstate', row: r }); }}>Reinstate</DropdownItem>}
              {(r.completion === 'refunded') && <p className="px-4 py-2.5 text-xs text-muted">No further actions.</p>}
            </div>
          )}
        </Dropdown>
      </span>
    ) },
  ];

  if (courses.status === 'failed' || students.status === 'failed') return <ErrorState message={courses.error ?? students.error ?? undefined} />;
  const loading = courses.status !== 'succeeded' || students.status !== 'succeeded';

  return (
    <>
      <PageHeader title="Enrollments" description={`${all.length} enrollments recorded`} />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4"><Input type="search" aria-label="Search enrollments" placeholder="Search by ID, student, course or instructor" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} leftIcon={<Search className="h-4 w-4" />} /></div>
        <Select aria-label="Filter by course" value={course} onChange={(e) => { setCourse(e.target.value); setPage(1); }} options={[{ value: 'all', label: 'All courses' }, ...courses.items.map((c) => ({ value: c.id, label: c.title }))]} />
        <Select aria-label="Filter by instructor" value={instructor} onChange={(e) => { setInstructor(e.target.value); setPage(1); }} options={[{ value: 'all', label: 'All instructors' }, ...instructors.map((i) => ({ value: i.id, label: i.name }))]} />
        <Select aria-label="Filter by payment status" value={payment} onChange={(e) => { setPayment(e.target.value); setPage(1); }} options={[{ value: 'all', label: 'Any payment status' }, { value: 'paid', label: 'Paid' }, { value: 'pending', label: 'Pending' }, { value: 'refunded', label: 'Refunded' }, { value: 'failed', label: 'Failed' }]} />
        <Select aria-label="Filter by enrollment status" value={completion} onChange={(e) => { setCompletion(e.target.value); setPage(1); }} options={[{ value: 'all', label: 'Any enrollment status' }, { value: 'active', label: 'Active' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }, { value: 'refunded', label: 'Refunded' }]} />
        <Input type="date" label="Enrolled from" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
        <Input type="date" label="Enrolled to" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(1); }} error={invalidRange ? 'End date must be after the start date.' : undefined} />
        <Select label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)} options={[{ value: 'date', label: 'Newest' }, { value: 'progress', label: 'Highest progress' }, { value: 'amount', label: 'Highest amount' }]} />
      </div>
      <Card padded={false} className="p-2 sm:p-4">
        {loading ? <div className="space-y-3 p-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div>
          : rows.length === 0 ? <EmptyState icon={filtersOn ? SearchX : ClipboardList} title="No enrollments found" description="Try changing your search or filters." action={filtersOn ? <Button onClick={reset}>Clear filters</Button> : undefined} />
          : <Table columns={columns} rows={visible} rowKey={(r) => r.id} />}
      </Card>
      <div className="mt-6"><Pagination page={current} totalPages={totalPages} onChange={setPage} /></div>

      <Drawer open={Boolean(detail)} onClose={() => setView(null)} title="Enrollment details" side="right">
        {detail && (
          <div className="space-y-5 p-4">
            <div><p className="font-mono text-xs text-muted">{detail.id}</p><h3 className="mt-1 text-lg font-semibold text-fg">{detail.courseTitle}</h3><div className="mt-2 flex flex-wrap gap-2"><CompletionBadge status={detail.completion} /><PaymentBadge status={detail.payment} /></div></div>
            <ProgressBar value={detail.progress} showLabel label="Course progress" tone={detail.completion === 'completed' ? 'success' : 'brand'} />
            <dl className="grid grid-cols-2 gap-3 text-sm">{[['Student', detail.studentName], ['Instructor', detail.instructorName], ['Enrolled', formatDate(detail.enrolledAt)], ['Last activity', formatDate(detail.enrollment.lastAccessedAt)], ['Amount', formatCurrency(detail.amount)], ['Platform fee (20%)', formatCurrency(Math.round(detail.amount * 20) / 100)]].map(([l, v]) => <div key={l} className="rounded-xl bg-subtle p-3"><dt className="text-xs text-muted">{l}</dt><dd className="mt-0.5 font-semibold text-fg">{v}</dd></div>)}</dl>
            <p className="text-xs text-muted">Payment figures are demo data. No real payments are processed.</p>
          </div>
        )}
      </Drawer>

      {pending && <ConfirmDialog open title={COPY[pending.action].title} confirmLabel={COPY[pending.action].confirm} danger={COPY[pending.action].danger} onConfirm={run} onClose={() => setPending(null)}>{COPY[pending.action].body(pending.row)}</ConfirmDialog>}
    </>
  );
}
