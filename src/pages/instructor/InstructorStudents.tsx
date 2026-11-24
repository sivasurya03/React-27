import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SearchX, Users } from 'lucide-react';
import { StudentDetailDrawer } from '@/components/instructor/StudentDetailDrawer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar, Badge, Button, buttonStyles, Card, EmptyState, ErrorState, Input, Pagination, ProgressBar, Select, Skeleton, Table, type Column } from '@/components/ui';
import { fetchCourses } from '@/features/courses/courseSlice';
import { fetchStudents } from '@/features/students/studentSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/selectors';
import type { Enrollment } from '@/types';
import { formatDate, timeAgo } from '@/utils/format';
import { isActiveRecently } from '@/utils/instructorInsights';

const PAGE_SIZE = 8;
const REAL_STUDENT = 's1';

interface Row {
  enrollment: Enrollment;
  name: string;
  email: string;
  courseTitle: string;
}

export default function InstructorStudents() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const courses = useAppSelector((state) => state.courses);
  const students = useAppSelector((state) => state.students);
  const enrollments = useAppSelector((state) => state.enrollment.items);
  const learning = useAppSelector((state) => state.learning);

  const [q, setQ] = useState('');
  const [courseId, setCourseId] = useState('all');
  const [progress, setProgress] = useState('all');
  const [sort, setSort] = useState('activity');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);

  const own = useMemo(() => courses.items.filter((c) => c.instructorId === user?.id), [courses.items, user?.id]);
  const all = useMemo<Row[]>(() => {
    const ownIds = new Set(own.map((c) => c.id));
    return enrollments.filter((e) => ownIds.has(e.courseId)).flatMap((enrollment) => {
      const student = students.items.find((s) => s.id === enrollment.studentId);
      const course = own.find((c) => c.id === enrollment.courseId);
      return student && course ? [{ enrollment, name: student.name, email: student.email, courseTitle: course.title }] : [];
    });
  }, [enrollments, own, students.items]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const inRange = (p: number): boolean => progress === 'all' || (progress === '0' && p === 0) || (progress === '1-49' && p >= 1 && p <= 49) || (progress === '50-99' && p >= 50 && p <= 99) || (progress === '100' && p === 100);
    return all
      .filter((r) => (!term || r.name.toLowerCase().includes(term) || r.email.toLowerCase().includes(term)) && (courseId === 'all' || r.enrollment.courseId === courseId) && inRange(r.enrollment.progress))
      .sort((a, b) => sort === 'progress' ? b.enrollment.progress - a.enrollment.progress : sort === 'name' ? a.name.localeCompare(b.name) : sort === 'enrolled' ? b.enrollment.enrolledAt.localeCompare(a.enrollment.enrolledAt) : b.enrollment.lastAccessedAt.localeCompare(a.enrollment.lastAccessedAt));
  }, [all, q, courseId, progress, sort]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const reset = (fn: () => void) => (): void => { fn(); setPage(1); };

  const selectedStudent = students.items.find((s) => s.id === selected);
  const selectedEnrollments = all.filter((r) => r.enrollment.studentId === selected).map((r) => r.enrollment);

  const columns: Column<Row>[] = [
    { key: 'student', header: 'Student', className: 'min-w-48', cell: (r) => <span className="flex items-center gap-3"><Avatar name={r.name} size="sm" /><span className="min-w-0"><span className="block truncate font-medium text-fg">{r.name}</span><span className="block truncate text-xs font-normal text-muted">{r.email}</span></span></span> },
    { key: 'course', header: 'Course', cell: (r) => <span className="line-clamp-2">{r.courseTitle}</span> },
    { key: 'enrolled', header: 'Enrolled', cell: (r) => formatDate(r.enrollment.enrolledAt) },
    { key: 'progress', header: 'Progress', className: 'min-w-36', cell: (r) => <ProgressBar value={r.enrollment.progress} showLabel size="sm" tone={r.enrollment.status === 'completed' ? 'success' : 'brand'} label={`${r.name} progress`} /> },
    { key: 'completion', header: 'Completion', cell: (r) => <Badge variant={r.enrollment.status === 'completed' ? 'success' : r.enrollment.status === 'in-progress' ? 'info' : 'neutral'}>{r.enrollment.status === 'completed' ? 'Completed' : r.enrollment.status === 'in-progress' ? 'In progress' : 'Not started'}</Badge> },
    { key: 'activity', header: 'Last activity', cell: (r) => timeAgo(r.enrollment.lastAccessedAt) },
    { key: 'status', header: 'Status', cell: (r) => <Badge variant={isActiveRecently(r.enrollment.lastAccessedAt) ? 'success' : 'warning'}>{isActiveRecently(r.enrollment.lastAccessedAt) ? 'Active' : 'Inactive'}</Badge> },
    { key: 'view', header: 'Details', cell: (r) => <Button size="sm" variant="outline" aria-label={`View details for ${r.name}`} onClick={() => setSelected(r.enrollment.studentId)}>View</Button> },
  ];

  if (courses.status === 'failed' || students.status === 'failed') return <ErrorState message={courses.error ?? students.error ?? undefined} onRetry={() => { void dispatch(fetchCourses()); void dispatch(fetchStudents()); }} />;
  const loading = courses.status !== 'succeeded' || students.status !== 'succeeded';

  return (
    <>
      <PageHeader title="Students" description="Everyone enrolled in your courses, and how they are doing." />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_14rem_11rem_12rem]">
        <Input type="search" aria-label="Search students" placeholder="Search by name or email" value={q} onChange={(e) => reset(() => setQ(e.target.value))()} leftIcon={<Search className="h-4 w-4" />} />
        <Select aria-label="Filter by course" value={courseId} onChange={(e) => reset(() => setCourseId(e.target.value))()} options={[{ value: 'all', label: 'All courses' }, ...own.map((c) => ({ value: c.id, label: c.title }))]} />
        <Select aria-label="Filter by progress" value={progress} onChange={(e) => reset(() => setProgress(e.target.value))()} options={[{ value: 'all', label: 'Any progress' }, { value: '0', label: 'Not started' }, { value: '1-49', label: '1% to 49%' }, { value: '50-99', label: '50% to 99%' }, { value: '100', label: 'Completed' }]} />
        <Select aria-label="Sort students" value={sort} onChange={(e) => setSort(e.target.value)} options={[{ value: 'activity', label: 'Recent activity' }, { value: 'progress', label: 'Highest progress' }, { value: 'enrolled', label: 'Newest enrolment' }, { value: 'name', label: 'Name (A to Z)' }]} />
      </div>
      <Card padded={false} className="p-2 sm:p-4">
        {loading ? <div className="space-y-3 p-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div>
          : all.length === 0 ? <EmptyState icon={Users} title="No students yet" description="Students appear here once they enrol in one of your published courses." action={<Link to="/instructor/courses" className={buttonStyles('primary')}>View my courses</Link>} />
          : rows.length === 0 ? <EmptyState icon={SearchX} title="No students match your filters" action={<Button onClick={() => { setQ(''); setCourseId('all'); setProgress('all'); }}>Clear filters</Button>} />
          : <Table columns={columns} rows={visible} rowKey={(r) => r.enrollment.id} />}
      </Card>
      <div className="mt-6"><Pagination page={current} totalPages={totalPages} onChange={setPage} /></div>
      <StudentDetailDrawer student={selectedStudent} enrollments={selectedEnrollments} courses={own} learning={learning} realStudentId={REAL_STUDENT} onClose={() => setSelected(null)} />
    </>
  );
}
