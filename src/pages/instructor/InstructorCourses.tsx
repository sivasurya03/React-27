import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, Copy, Eye, Library, MoreHorizontal, Pencil, PlusCircle, RotateCcw, Search, SearchX, Send, Trash2, Undo2 } from 'lucide-react';
import { CourseThumbnail } from '@/components/common/CourseThumbnail';
import { CourseStatusBadge } from '@/components/instructor/CourseStatusBadge';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, buttonStyles, Card, ConfirmDialog, Dropdown, DropdownItem, EmptyState, ErrorState, Input, Pagination, Select, Skeleton, Table, useToast, type Column } from '@/components/ui';
import { changeCourseStatus, deleteCourse, fetchCourses, saveCourse } from '@/features/courses/courseSlice';
import { addNotification } from '@/features/notifications/notificationSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/selectors';
import { COURSE_CATEGORIES, type Course } from '@/types';
import { duplicateCourse } from '@/utils/courseBuilder';
import { formatCompact, formatCurrency, formatDate, netPrice } from '@/utils/format';
import { Rating } from '@/components/courses/Rating';

type Action = 'publish' | 'submit' | 'withdraw' | 'unpublish' | 'archive' | 'restore' | 'delete';
const PAGE_SIZE = 6;

const COPY: Record<Action, { title: string; confirm: string; body: (c: Course) => string; danger?: boolean }> = {
  publish: { title: 'Publish course?', confirm: 'Publish', body: (c) => `“${c.title}” will become visible to students and open for enrolment.` },
  submit: { title: 'Submit for review?', confirm: 'Submit', body: (c) => `“${c.title}” will be sent to an administrator. It goes live once approved.` },
  withdraw: { title: 'Withdraw submission?', confirm: 'Withdraw', body: (c) => `“${c.title}” will return to your drafts.` },
  unpublish: { title: 'Unpublish course?', confirm: 'Unpublish', body: (c) => `“${c.title}” will move back to draft and disappear from the catalogue. Enrolled students keep access.` },
  archive: { title: 'Archive course?', confirm: 'Archive', body: (c) => `“${c.title}” will be hidden and closed to new enrolments. Enrolled students keep access.` },
  restore: { title: 'Restore as draft?', confirm: 'Restore', body: (c) => `“${c.title}” will return to your drafts so you can edit and republish it.` },
  delete: { title: 'Delete course?', confirm: 'Delete', danger: true, body: (c) => `“${c.title}” and its curriculum will be permanently removed. This cannot be undone.` },
};

export default function InstructorCourses() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const user = useAppSelector(selectCurrentUser);
  const { items, status, error, curricula, lessonContent } = useAppSelector((state) => state.courses);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('updated');
  const [page, setPage] = useState(1);
  const approvals = useAppSelector((state) => state.admin.settings.courseApprovals);
  const instructorStatus = useAppSelector((state) => state.instructors.items.find((i) => i.id === user?.id)?.status);
  const instructorApprovals = useAppSelector((state) => state.admin.settings.instructorApprovals);
  const [pending, setPending] = useState<{ action: Action; course: Course } | null>(null);
  const [busy, setBusy] = useState(false);

  const own = useMemo(() => items.filter((c) => c.instructorId === user?.id), [items, user?.id]);
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = own.filter((c) => (!term || c.title.toLowerCase().includes(term) || c.tags.some((t) => t.includes(term))) && (category === 'all' || c.category === category) && (statusFilter === 'all' || c.status === statusFilter));
    const by: Record<string, (a: Course, b: Course) => number> = {
      updated: (a, b) => (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt),
      students: (a, b) => b.studentsCount - a.studentsCount,
      rating: (a, b) => b.rating - a.rating,
      title: (a, b) => a.title.localeCompare(b.title),
    };
    return [...filtered].sort(by[sort]);
  }, [own, q, category, statusFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const filtersActive = q !== '' || category !== 'all' || statusFilter !== 'all';

  const ask = (action: Action, course: Course): void => {
    if (action === 'publish' || action === 'submit') {
      if (instructorApprovals && instructorStatus === 'pending') {
        toast.error('Your instructor account is awaiting approval', 'An administrator must approve it before you can publish.');
        return;
      }
      const chapters = curricula[course.id] ?? [];
      if (course.description.trim().length < 40 || !chapters.some((c) => c.lessons.length > 0)) {
        toast.error('Finish this course before publishing', 'Open the editor to add a description and at least one lesson.');
        return;
      }
    }
    setPending({ action, course });
  };

  const run = async (): Promise<void> => {
    if (!pending) return;
    const { action, course } = pending;
    setBusy(true);
    const result = action === 'delete'
      ? await dispatch(deleteCourse(course.id))
      : await dispatch(changeCourseStatus({ id: course.id, status: action === 'publish' ? 'published' : action === 'submit' ? 'pending' : action === 'archive' ? 'archived' : 'draft' }));
    setBusy(false);
    setPending(null);
    const ok = action === 'delete' ? deleteCourse.fulfilled.match(result) : changeCourseStatus.fulfilled.match(result);
    if (ok && action === 'submit') dispatch(addNotification({ type: 'course-update', audience: 'admin', title: 'Course submitted for review', message: `${course.title} is waiting for approval.` }));
    if (ok) toast.success({ publish: 'Course published', submit: 'Submitted for review', withdraw: 'Submission withdrawn', unpublish: 'Course unpublished', archive: 'Course archived', restore: 'Course restored as draft', delete: 'Course deleted' }[action], course.title);
    else toast.error('That did not work', 'Please try again.');
  };

  const duplicate = async (course: Course): Promise<void> => {
    if (!user) return;
    const copy = duplicateCourse(course, curricula[course.id] ?? [], lessonContent, user.id);
    const result = await dispatch(saveCourse({ course: copy.course, chapters: copy.chapters, content: copy.content }));
    if (saveCourse.fulfilled.match(result)) toast.success('Course duplicated', copy.course.title);
    else toast.error('Could not duplicate the course');
  };

  const columns: Column<Course>[] = [
    { key: 'course', header: 'Course', className: 'min-w-64', cell: (c) => (
      <span className="flex items-center gap-3"><CourseThumbnail src={c.thumbnail} alt="" className="hidden h-12 w-20 shrink-0 rounded-lg sm:block" /><span className="min-w-0"><span className="block truncate font-medium text-fg">{c.title}</span><span className="block text-xs font-normal text-muted">{c.level}</span>{c.status === 'rejected' && c.rejectionReason && <span className="mt-0.5 block text-xs font-normal text-rose-600 dark:text-rose-400">Rejected: {c.rejectionReason}</span>}</span></span>
    ) },
    { key: 'category', header: 'Category', cell: (c) => c.category },
    { key: 'students', header: 'Students', cell: (c) => formatCompact(c.studentsCount) },
    { key: 'rating', header: 'Rating', cell: (c) => (c.rating > 0 ? <Rating value={c.rating} /> : <span className="text-muted">No ratings</span>) },
    { key: 'price', header: 'Price', cell: (c) => (c.price === 0 ? 'Free' : formatCurrency(netPrice(c.price, c.discount))) },
    { key: 'status', header: 'Status', cell: (c) => <CourseStatusBadge status={c.status} /> },
    { key: 'updated', header: 'Updated', cell: (c) => formatDate(c.updatedAt ?? c.createdAt) },
    { key: 'actions', header: 'Actions', cell: (c) => (
      <span className="flex items-center gap-1">
        <Link to={`/instructor/courses/${c.id}/edit`} className={buttonStyles('outline', 'sm')} aria-label={`Edit ${c.title}`}><Pencil className="mr-1.5 h-4 w-4" aria-hidden />Edit</Link>
        <Dropdown ariaLabel={`More actions for ${c.title}`} widthClass="w-52" triggerClassName="flex h-8 w-8 items-center justify-center text-muted hover:bg-subtle hover:text-fg" trigger={() => <MoreHorizontal className="h-5 w-5" />}>
          {(close) => (
            <div className="py-1">
              <Link to={`/instructor/courses/${c.id}/preview`} onClick={close} role="menuitem" className="flex items-center gap-3 px-4 py-2.5 text-sm text-fg hover:bg-subtle"><Eye className="h-4 w-4" />Preview</Link>
              <DropdownItem icon={<Copy className="h-4 w-4" />} onClick={() => { close(); void duplicate(c); }}>Duplicate</DropdownItem>
              {(c.status === 'draft' || c.status === 'rejected') && <DropdownItem icon={<Send className="h-4 w-4" />} onClick={() => { close(); ask(approvals ? 'submit' : 'publish', c); }}>{approvals ? 'Submit for review' : 'Publish'}</DropdownItem>}
              {c.status === 'pending' && <DropdownItem icon={<Undo2 className="h-4 w-4" />} onClick={() => { close(); ask('withdraw', c); }}>Withdraw submission</DropdownItem>}
              {c.status === 'published' && <DropdownItem icon={<Undo2 className="h-4 w-4" />} onClick={() => { close(); ask('unpublish', c); }}>Unpublish</DropdownItem>}
              {c.status !== 'archived' ? <DropdownItem icon={<Archive className="h-4 w-4" />} onClick={() => { close(); ask('archive', c); }}>Archive</DropdownItem> : <DropdownItem icon={<RotateCcw className="h-4 w-4" />} onClick={() => { close(); ask('restore', c); }}>Restore as draft</DropdownItem>}
              <DropdownItem danger icon={<Trash2 className="h-4 w-4" />} onClick={() => { close(); ask('delete', c); }}>Delete</DropdownItem>
            </div>
          )}
        </Dropdown>
      </span>
    ) },
  ];

  if (status === 'failed') return <ErrorState message={error ?? undefined} onRetry={() => void dispatch(fetchCourses())} />;

  return (
    <>
      <PageHeader title="My courses" description="Create, edit and manage the courses you teach." actions={<Link to="/instructor/courses/create" className={buttonStyles('primary')}><PlusCircle className="mr-2 h-4 w-4" aria-hidden />Create course</Link>} />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_10rem_11rem]">
        <Input type="search" aria-label="Search my courses" placeholder="Search by title or tag" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} leftIcon={<Search className="h-4 w-4" />} />
        <Select aria-label="Filter by category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} options={[{ value: 'all', label: 'All categories' }, ...COURSE_CATEGORIES.map((c) => ({ value: c, label: c }))]} />
        <Select aria-label="Filter by status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} options={[{ value: 'all', label: 'All statuses' }, { value: 'draft', label: 'Draft' }, { value: 'pending', label: 'Pending review' }, { value: 'published', label: 'Published' }, { value: 'rejected', label: 'Rejected' }, { value: 'archived', label: 'Archived' }]} />
        <Select aria-label="Sort courses" value={sort} onChange={(e) => setSort(e.target.value)} options={[{ value: 'updated', label: 'Recently updated' }, { value: 'students', label: 'Most students' }, { value: 'rating', label: 'Highest rated' }, { value: 'title', label: 'Title (A to Z)' }]} />
      </div>
      <Card padded={false} className="p-2 sm:p-4">
        {status !== 'succeeded' ? (
          <div className="space-y-3 p-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : own.length === 0 ? (
          <EmptyState icon={Library} title="You have not created a course yet" description="Build your first course and share it with students." action={<Link to="/instructor/courses/create" className={buttonStyles('primary')}>Create your first course</Link>} />
        ) : rows.length === 0 ? (
          <EmptyState icon={SearchX} title="No courses match your filters" action={filtersActive ? <Button onClick={() => { setQ(''); setCategory('all'); setStatusFilter('all'); }}>Clear filters</Button> : undefined} />
        ) : (
          <Table columns={columns} rows={visible} rowKey={(c) => c.id} />
        )}
      </Card>
      <div className="mt-6"><Pagination page={current} totalPages={totalPages} onChange={setPage} /></div>

      {pending && (
        <ConfirmDialog open title={COPY[pending.action].title} confirmLabel={COPY[pending.action].confirm} danger={COPY[pending.action].danger} loading={busy} onConfirm={() => void run()} onClose={() => setPending(null)}>
          {COPY[pending.action].body(pending.course)}
        </ConfirmDialog>
      )}
    </>
  );
}
