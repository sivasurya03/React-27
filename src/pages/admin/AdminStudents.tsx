import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, MoreHorizontal, Pencil, Search, SearchX, ShieldCheck, ShieldOff, UserX, Users } from 'lucide-react';
import { AccountStatusBadge, CompletionBadge } from '@/components/admin/AdminBadges';
import { PersonEditModal } from '@/components/admin/PersonEditModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar, Button, Card, ConfirmDialog, Drawer, Dropdown, DropdownItem, EmptyState, ErrorState, Input, Pagination, ProgressBar, Select, Skeleton, Table, useToast, type Column } from '@/components/ui';
import { fetchStudents, setStudentStatus, updateStudent } from '@/features/students/studentSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { AccountStatus, Student } from '@/types';
import { buildEnrollmentRows } from '@/utils/adminInsights';
import { formatDate, timeAgo } from '@/utils/format';

const PAGE_SIZE = 8;
const STATUS_COPY: Record<AccountStatus, { title: string; confirm: string; body: (s: Student) => string; done: string; danger?: boolean }> = {
  active: { title: 'Activate account?', confirm: 'Activate', done: 'Student activated', body: (s) => `${s.name} will be able to sign in and learn again.` },
  suspended: { title: 'Suspend account?', confirm: 'Suspend', done: 'Student suspended', danger: true, body: (s) => `${s.name} will be signed out and blocked from the platform until you activate the account again.` },
  deactivated: { title: 'Deactivate account?', confirm: 'Deactivate', done: 'Student deactivated', danger: true, body: (s) => `${s.name}'s account will be closed. Their learning history is kept.` },
};

interface Row { student: Student; enrolled: number; completed: number; progress: number }

export default function AdminStudents() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [params] = useSearchParams();
  const students = useAppSelector((s) => s.students);
  const courses = useAppSelector((s) => s.courses.items);
  const instructors = useAppSelector((s) => s.instructors.items);
  const enrollments = useAppSelector((s) => s.enrollment.items);
  const certificates = useAppSelector((s) => s.learning.certificates);

  const [q, setQ] = useState(params.get('q') ?? '');
  const [status, setStatus] = useState('all');
  const [course, setCourse] = useState('all');
  const [enrolFilter, setEnrolFilter] = useState('all');
  const [sort, setSort] = useState('joined');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<string | null>(null);
  const [edit, setEdit] = useState<Student | null>(null);
  const [pending, setPending] = useState<{ student: Student; status: AccountStatus } | null>(null);
  const [busy, setBusy] = useState(false);

  const all = useMemo(() => buildEnrollmentRows(enrollments, courses, students.items, instructors), [enrollments, courses, students.items, instructors]);
  const rows = useMemo<Row[]>(() => {
    const term = q.trim().toLowerCase();
    return students.items
      .map((student) => {
        const mine = all.filter((r) => r.studentId === student.id && r.completion !== 'cancelled' && r.completion !== 'refunded');
        return { student, enrolled: mine.length, completed: mine.filter((r) => r.completion === 'completed').length, progress: mine.length ? Math.round(mine.reduce((s, r) => s + r.progress, 0) / mine.length) : 0 };
      })
      .filter((r) => (!term || r.student.name.toLowerCase().includes(term) || r.student.email.toLowerCase().includes(term)) && (status === 'all' || (r.student.status ?? 'active') === status)
        && (course === 'all' || all.some((e) => e.studentId === r.student.id && e.courseId === course))
        && (enrolFilter === 'all' || (enrolFilter === 'none' && r.enrolled === 0) || (enrolFilter === 'some' && r.enrolled > 0) || (enrolFilter === 'completed' && r.completed > 0)))
      .sort((a, b) => sort === 'name' ? a.student.name.localeCompare(b.student.name) : sort === 'progress' ? b.progress - a.progress : sort === 'enrolled' ? b.enrolled - a.enrolled : (b.student.joinedAt ?? '').localeCompare(a.student.joinedAt ?? ''));
  }, [students.items, all, q, status, course, enrolFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const filtersOn = q !== '' || status !== 'all' || course !== 'all' || enrolFilter !== 'all';
  const detail = students.items.find((s) => s.id === view);

  const run = async (): Promise<void> => {
    if (!pending) return;
    setBusy(true);
    const result = await dispatch(setStudentStatus({ id: pending.student.id, status: pending.status }));
    setBusy(false);
    if (setStudentStatus.fulfilled.match(result)) toast.success(STATUS_COPY[pending.status].done, pending.student.name);
    else toast.error('Could not update the account', result.payload);
    setPending(null);
  };

  const columns: Column<Row>[] = [
    { key: 'student', header: 'Student', className: 'min-w-52', cell: (r) => <span className="flex items-center gap-3"><Avatar name={r.student.name} src={r.student.avatar} size="sm" /><span className="min-w-0"><span className="block truncate font-medium text-fg">{r.student.name}</span><span className="block truncate text-xs font-normal text-muted">{r.student.email}</span></span></span> },
    { key: 'enrolled', header: 'Enrolled', cell: (r) => r.enrolled },
    { key: 'completed', header: 'Completed', cell: (r) => r.completed },
    { key: 'progress', header: 'Progress', className: 'min-w-32', cell: (r) => <ProgressBar value={r.progress} showLabel size="sm" label={`${r.student.name} average progress`} /> },
    { key: 'status', header: 'Status', cell: (r) => <AccountStatusBadge status={r.student.status} /> },
    { key: 'joined', header: 'Joined', cell: (r) => (r.student.joinedAt ? formatDate(r.student.joinedAt) : '—') },
    { key: 'actions', header: 'Actions', cell: (r) => (
      <span className="flex items-center gap-1">
        <Button size="sm" variant="outline" leftIcon={<Eye className="h-4 w-4" />} aria-label={`View ${r.student.name}`} onClick={() => setView(r.student.id)}>View</Button>
        <Dropdown ariaLabel={`More actions for ${r.student.name}`} widthClass="w-48" triggerClassName="flex h-8 w-8 items-center justify-center text-muted hover:bg-subtle hover:text-fg" trigger={() => <MoreHorizontal className="h-5 w-5" />}>
          {(close) => (
            <div className="py-1">
              <DropdownItem icon={<Pencil className="h-4 w-4" />} onClick={() => { close(); setEdit(r.student); }}>Edit</DropdownItem>
              {(r.student.status ?? 'active') !== 'active' && <DropdownItem icon={<ShieldCheck className="h-4 w-4" />} onClick={() => { close(); setPending({ student: r.student, status: 'active' }); }}>Activate</DropdownItem>}
              {(r.student.status ?? 'active') === 'active' && <DropdownItem danger icon={<ShieldOff className="h-4 w-4" />} onClick={() => { close(); setPending({ student: r.student, status: 'suspended' }); }}>Suspend</DropdownItem>}
              {r.student.status !== 'deactivated' && <DropdownItem danger icon={<UserX className="h-4 w-4" />} onClick={() => { close(); setPending({ student: r.student, status: 'deactivated' }); }}>Deactivate</DropdownItem>}
            </div>
          )}
        </Dropdown>
      </span>
    ) },
  ];

  if (students.status === 'failed') return <ErrorState message={students.error ?? undefined} onRetry={() => void dispatch(fetchStudents())} />;

  return (
    <>
      <PageHeader title="Students" description={`${students.items.length} registered students`} />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_9rem_14rem_11rem_10rem]">
        <Input type="search" aria-label="Search students" placeholder="Search by name or email" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} leftIcon={<Search className="h-4 w-4" />} />
        <Select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={[{ value: 'all', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'suspended', label: 'Suspended' }, { value: 'deactivated', label: 'Deactivated' }]} />
        <Select aria-label="Filter by course" value={course} onChange={(e) => { setCourse(e.target.value); setPage(1); }} options={[{ value: 'all', label: 'Any course' }, ...courses.map((c) => ({ value: c.id, label: c.title }))]} />
        <Select aria-label="Filter by enrollment" value={enrolFilter} onChange={(e) => { setEnrolFilter(e.target.value); setPage(1); }} options={[{ value: 'all', label: 'Any enrollment' }, { value: 'some', label: 'Has enrollments' }, { value: 'none', label: 'No enrollments' }, { value: 'completed', label: 'Completed a course' }]} />
        <Select aria-label="Sort students" value={sort} onChange={(e) => setSort(e.target.value)} options={[{ value: 'joined', label: 'Newest' }, { value: 'name', label: 'Name (A to Z)' }, { value: 'progress', label: 'Progress' }, { value: 'enrolled', label: 'Most enrolled' }]} />
      </div>
      <Card padded={false} className="p-2 sm:p-4">
        {students.status !== 'succeeded' ? <div className="space-y-3 p-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div>
          : rows.length === 0 ? <EmptyState icon={filtersOn ? SearchX : Users} title="No students found" description="Try changing your search or filters." action={filtersOn ? <Button onClick={() => { setQ(''); setStatus('all'); setCourse('all'); setEnrolFilter('all'); }}>Clear filters</Button> : undefined} />
          : <Table columns={columns} rows={visible} rowKey={(r) => r.student.id} />}
      </Card>
      <div className="mt-6"><Pagination page={current} totalPages={totalPages} onChange={setPage} /></div>

      <Drawer open={Boolean(detail)} onClose={() => setView(null)} title="Student details" side="right">
        {detail && (() => {
          const mine = all.filter((r) => r.studentId === detail.id);
          const certs = certificates.filter((c) => c.studentId === detail.id);
          return (
            <div className="space-y-6 p-4">
              <div className="flex items-center gap-3"><Avatar name={detail.name} src={detail.avatar} size="lg" /><div className="min-w-0"><p className="truncate text-lg font-semibold text-fg">{detail.name}</p><p className="truncate text-sm text-muted">{detail.email}</p><div className="mt-1"><AccountStatusBadge status={detail.status} /></div></div></div>
              <dl className="grid grid-cols-2 gap-3 text-sm">{[['Joined', detail.joinedAt ? formatDate(detail.joinedAt) : '—'], ['Enrolled', String(mine.filter((r) => r.completion !== 'cancelled' && r.completion !== 'refunded').length)], ['Completed', String(mine.filter((r) => r.completion === 'completed').length)], ['Certificates', String(certs.length)], ['Learning hours', String(detail.learningHours)], ['Day streak', String(detail.streak)]].map(([l, v]) => <div key={l} className="rounded-xl bg-subtle p-3"><dt className="text-xs text-muted">{l}</dt><dd className="mt-0.5 font-semibold text-fg">{v}</dd></div>)}</dl>
              <section><h3 className="mb-3 text-sm font-semibold text-fg">Enrollment history</h3>
                {mine.length === 0 ? <p className="text-sm text-muted">No enrollments yet.</p> : (
                  <ul className="space-y-3">{mine.map((r) => <li key={r.id} className="rounded-xl border border-line p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium text-fg">{r.courseTitle}</p><CompletionBadge status={r.completion} /></div><div className="mt-2"><ProgressBar value={r.progress} showLabel size="sm" label={`${r.courseTitle} progress`} /></div><p className="mt-2 text-xs text-muted">Enrolled {formatDate(r.enrolledAt)} · last active {timeAgo(r.enrollment.lastAccessedAt)}</p></li>)}</ul>
                )}
              </section>
              <section><h3 className="mb-3 text-sm font-semibold text-fg">Certificates</h3>{certs.length === 0 ? <p className="text-sm text-muted">No certificates earned yet.</p> : <ul className="space-y-2 text-sm">{certs.map((c) => <li key={c.id} className="flex justify-between gap-3"><span className="text-fg">{c.courseTitle}</span><span className="text-muted">{formatDate(c.completedAt)}</span></li>)}</ul>}</section>
              <section><h3 className="mb-3 text-sm font-semibold text-fg">Recent activity</h3>{mine.length === 0 ? <p className="text-sm text-muted">No activity yet.</p> : <ul className="space-y-2 text-sm">{[...mine].sort((a, b) => b.enrollment.lastAccessedAt.localeCompare(a.enrollment.lastAccessedAt)).slice(0, 4).map((r) => <li key={r.id} className="flex justify-between gap-3"><span className="truncate text-fg">Studied {r.courseTitle}</span><span className="shrink-0 text-muted">{timeAgo(r.enrollment.lastAccessedAt)}</span></li>)}</ul>}</section>
            </div>
          );
        })()}
      </Drawer>

      {edit && <PersonEditModal title="Edit student" initial={edit} saving={busy} onClose={() => setEdit(null)} onSave={async (v) => { setBusy(true); const r = await dispatch(updateStudent({ id: edit.id, name: v.name, email: v.email })); setBusy(false); if (updateStudent.fulfilled.match(r)) { toast.success('Student updated', v.name); setEdit(null); } else toast.error('Could not save changes', r.payload); }} />}
      {pending && <ConfirmDialog open title={STATUS_COPY[pending.status].title} confirmLabel={STATUS_COPY[pending.status].confirm} danger={STATUS_COPY[pending.status].danger} loading={busy} onConfirm={() => void run()} onClose={() => setPending(null)}>{STATUS_COPY[pending.status].body(pending.student)}</ConfirmDialog>}
    </>
  );
}
