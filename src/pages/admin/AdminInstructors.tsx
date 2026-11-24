import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BadgeCheck, Eye, GraduationCap, MoreHorizontal, Pencil, Search, SearchX, ShieldCheck, ShieldOff } from 'lucide-react';
import { AccountStatusBadge } from '@/components/admin/AdminBadges';
import { PersonEditModal } from '@/components/admin/PersonEditModal';
import { CourseStatusBadge } from '@/components/instructor/CourseStatusBadge';
import { Rating } from '@/components/courses/Rating';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar, Button, Card, ConfirmDialog, Drawer, Dropdown, DropdownItem, EmptyState, ErrorState, Input, Pagination, Select, Skeleton, Table, useToast, type Column } from '@/components/ui';
import { fetchInstructors, setInstructorStatus, updateInstructor } from '@/features/instructors/instructorSlice';
import { completionRateFor } from '@/services/instructorAnalytics';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { Instructor } from '@/types';
import { formatCompact, formatCurrency, formatDate, netPrice, timeAgo } from '@/utils/format';

const PAGE_SIZE = 8;
type Target = NonNullable<Instructor['status']>;
const COPY: Record<Target, { title: string; confirm: string; done: string; danger?: boolean; body: (i: Instructor) => string }> = {
  active: { title: 'Activate instructor?', confirm: 'Activate', done: 'Instructor activated', body: (i) => `${i.name} will be able to publish courses and sign in.` },
  suspended: { title: 'Suspend instructor?', confirm: 'Suspend', done: 'Instructor suspended', danger: true, body: (i) => `${i.name} will be signed out and cannot manage courses until reactivated. Their published courses stay visible.` },
  pending: { title: 'Set to pending?', confirm: 'Set pending', done: 'Instructor set to pending', body: (i) => `${i.name} will need approval again.` },
};

interface Row { instructor: Instructor; courses: number; students: number; revenue: number; rating: number }

export default function AdminInstructors() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [params] = useSearchParams();
  const state = useAppSelector((s) => s.instructors);
  const courses = useAppSelector((s) => s.courses.items);
  const enrollments = useAppSelector((s) => s.enrollment.items);
  const [q, setQ] = useState(params.get('q') ?? '');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('revenue');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<string | null>(null);
  const [edit, setEdit] = useState<Instructor | null>(null);
  const [pending, setPending] = useState<{ instructor: Instructor; status: Target } | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo<Row[]>(() => {
    const term = q.trim().toLowerCase();
    return state.items.map((instructor) => {
      const own = courses.filter((c) => c.instructorId === instructor.id);
      const rated = own.filter((c) => c.rating > 0);
      return { instructor, courses: own.length, students: own.reduce((s, c) => s + c.studentsCount, 0), revenue: Math.round(own.reduce((s, c) => s + c.studentsCount * netPrice(c.price, c.discount), 0)), rating: rated.length ? Math.round((rated.reduce((s, c) => s + c.rating, 0) / rated.length) * 10) / 10 : 0 };
    }).filter((r) => (!term || r.instructor.name.toLowerCase().includes(term) || r.instructor.email.toLowerCase().includes(term)) && (status === 'all' || (r.instructor.status ?? 'active') === status))
      .sort((a, b) => sort === 'name' ? a.instructor.name.localeCompare(b.instructor.name) : sort === 'students' ? b.students - a.students : sort === 'rating' ? b.rating - a.rating : sort === 'courses' ? b.courses - a.courses : b.revenue - a.revenue);
  }, [state.items, courses, q, status, sort]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const detail = rows.find((r) => r.instructor.id === view) ?? null;

  const run = async (): Promise<void> => {
    if (!pending) return;
    setBusy(true);
    const result = await dispatch(setInstructorStatus({ id: pending.instructor.id, status: pending.status }));
    setBusy(false);
    if (setInstructorStatus.fulfilled.match(result)) toast.success(COPY[pending.status].done, pending.instructor.name);
    else toast.error('Could not update the instructor', result.payload);
    setPending(null);
  };

  const columns: Column<Row>[] = [
    { key: 'instructor', header: 'Instructor', className: 'min-w-52', cell: (r) => <span className="flex items-center gap-3"><Avatar name={r.instructor.name} src={r.instructor.avatar} size="sm" /><span className="min-w-0"><span className="block truncate font-medium text-fg">{r.instructor.name}</span><span className="block truncate text-xs font-normal text-muted">{r.instructor.email}</span></span></span> },
    { key: 'status', header: 'Status', cell: (r) => <AccountStatusBadge status={r.instructor.status} /> },
    { key: 'courses', header: 'Courses', cell: (r) => r.courses },
    { key: 'students', header: 'Students', cell: (r) => formatCompact(r.students) },
    { key: 'revenue', header: 'Revenue', cell: (r) => formatCurrency(r.revenue) },
    { key: 'rating', header: 'Rating', cell: (r) => (r.rating > 0 ? <Rating value={r.rating} /> : <span className="text-muted">No ratings</span>) },
    { key: 'actions', header: 'Actions', cell: (r) => (
      <span className="flex items-center gap-1">
        <Button size="sm" variant="outline" leftIcon={<Eye className="h-4 w-4" />} aria-label={`View ${r.instructor.name}`} onClick={() => setView(r.instructor.id)}>View</Button>
        <Dropdown ariaLabel={`More actions for ${r.instructor.name}`} widthClass="w-48" triggerClassName="flex h-8 w-8 items-center justify-center text-muted hover:bg-subtle hover:text-fg" trigger={() => <MoreHorizontal className="h-5 w-5" />}>
          {(close) => (
            <div className="py-1">
              <DropdownItem icon={<Pencil className="h-4 w-4" />} onClick={() => { close(); setEdit(r.instructor); }}>Edit</DropdownItem>
              {r.instructor.status === 'pending' && <DropdownItem icon={<BadgeCheck className="h-4 w-4" />} onClick={() => { close(); setPending({ instructor: r.instructor, status: 'active' }); }}>Approve</DropdownItem>}
              {r.instructor.status === 'suspended' && <DropdownItem icon={<ShieldCheck className="h-4 w-4" />} onClick={() => { close(); setPending({ instructor: r.instructor, status: 'active' }); }}>Activate</DropdownItem>}
              {(r.instructor.status ?? 'active') !== 'suspended' && <DropdownItem danger icon={<ShieldOff className="h-4 w-4" />} onClick={() => { close(); setPending({ instructor: r.instructor, status: 'suspended' }); }}>Suspend</DropdownItem>}
            </div>
          )}
        </Dropdown>
      </span>
    ) },
  ];

  if (state.status === 'failed') return <ErrorState message={state.error ?? undefined} onRetry={() => void dispatch(fetchInstructors())} />;

  return (
    <>
      <PageHeader title="Instructors" description={`${state.items.length} instructors on the platform`} />
      <div className="mb-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-[1fr_11rem_12rem]">
        <Input type="search" aria-label="Search instructors" placeholder="Search by name or email" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} leftIcon={<Search className="h-4 w-4" />} />
        <Select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={[{ value: 'all', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'pending', label: 'Pending approval' }, { value: 'suspended', label: 'Suspended' }]} />
        <Select aria-label="Sort instructors" value={sort} onChange={(e) => setSort(e.target.value)} options={[{ value: 'revenue', label: 'Highest revenue' }, { value: 'students', label: 'Most students' }, { value: 'rating', label: 'Highest rated' }, { value: 'courses', label: 'Most courses' }, { value: 'name', label: 'Name (A to Z)' }]} />
      </div>
      <Card padded={false} className="p-2 sm:p-4">
        {state.status !== 'succeeded' ? <div className="space-y-3 p-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div>
          : rows.length === 0 ? <EmptyState icon={q || status !== 'all' ? SearchX : GraduationCap} title="No instructors found" description="Try changing your search or filters." action={<Button onClick={() => { setQ(''); setStatus('all'); }}>Clear filters</Button>} />
          : <Table columns={columns} rows={visible} rowKey={(r) => r.instructor.id} />}
      </Card>
      <div className="mt-6"><Pagination page={current} totalPages={totalPages} onChange={setPage} /></div>

      <Drawer open={Boolean(detail)} onClose={() => setView(null)} title="Instructor details" side="right">
        {detail && (() => {
          const own = courses.filter((c) => c.instructorId === detail.instructor.id);
          const ownIds = new Set(own.map((c) => c.id));
          const recent = enrollments.filter((e) => ownIds.has(e.courseId)).sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt)).slice(0, 4);
          const live = own.filter((c) => c.studentsCount > 0);
          const completion = live.length ? Math.round(live.reduce((s, c) => s + completionRateFor(c), 0) / live.length) : 0;
          return (
            <div className="space-y-6 p-4">
              <div className="flex items-center gap-3"><Avatar name={detail.instructor.name} src={detail.instructor.avatar} size="lg" /><div className="min-w-0"><p className="truncate text-lg font-semibold text-fg">{detail.instructor.name}</p><p className="truncate text-sm text-muted">{detail.instructor.email}</p><div className="mt-1"><AccountStatusBadge status={detail.instructor.status} /></div></div></div>
              <p className="text-sm leading-relaxed text-muted">{detail.instructor.bio}</p>
              <dl className="grid grid-cols-2 gap-3 text-sm">{[['Joined', detail.instructor.joinedAt ? formatDate(detail.instructor.joinedAt) : '—'], ['Courses', String(detail.courses)], ['Students', formatCompact(detail.students)], ['Revenue', formatCurrency(detail.revenue)], ['Avg. rating', detail.rating ? detail.rating.toFixed(1) : 'No ratings'], ['Avg. completion', `${completion}%`]].map(([l, v]) => <div key={l} className="rounded-xl bg-subtle p-3"><dt className="text-xs text-muted">{l}</dt><dd className="mt-0.5 font-semibold text-fg">{v}</dd></div>)}</dl>
              <section><h3 className="mb-3 text-sm font-semibold text-fg">Courses</h3>{own.length === 0 ? <p className="text-sm text-muted">No courses yet.</p> : <ul className="space-y-2">{own.map((c) => <li key={c.id} className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate text-fg">{c.title}</span><CourseStatusBadge status={c.status} /></li>)}</ul>}</section>
              <section><h3 className="mb-3 text-sm font-semibold text-fg">Recent activity</h3>{recent.length === 0 ? <p className="text-sm text-muted">No recent enrollments.</p> : <ul className="space-y-2 text-sm">{recent.map((e) => <li key={e.id} className="flex justify-between gap-3"><span className="truncate text-fg">New enrollment in {own.find((c) => c.id === e.courseId)?.title}</span><span className="shrink-0 text-muted">{timeAgo(e.enrolledAt)}</span></li>)}</ul>}</section>
            </div>
          );
        })()}
      </Drawer>

      {edit && <PersonEditModal title="Edit instructor" withBio initial={edit} saving={busy} onClose={() => setEdit(null)} onSave={async (v) => { setBusy(true); const r = await dispatch(updateInstructor({ id: edit.id, ...v })); setBusy(false); if (updateInstructor.fulfilled.match(r)) { toast.success('Instructor updated', v.name); setEdit(null); } else toast.error('Could not save changes', r.payload); }} />}
      {pending && <ConfirmDialog open title={COPY[pending.status].title} confirmLabel={COPY[pending.status].confirm} danger={COPY[pending.status].danger} loading={busy} onConfirm={() => void run()} onClose={() => setPending(null)}>{COPY[pending.status].body(pending.instructor)}</ConfirmDialog>}
    </>
  );
}
