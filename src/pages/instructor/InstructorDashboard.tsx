import { useCallback, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Archive, BookCheck, CheckCircle2, ClipboardCheck, DollarSign, FileEdit, GraduationCap, Library, MessageSquare, PlusCircle, Star, TrendingUp, UserPlus, Users, type LucideIcon } from 'lucide-react';
import { AreaTrendChart } from '@/components/charts/TrendCharts';
import { CoursePerformanceChart } from '@/components/charts/MultiCharts';
import { CourseThumbnail } from '@/components/common/CourseThumbnail';
import { StatCard } from '@/components/common/StatCard';
import { Rating } from '@/components/courses/Rating';
import { CourseStatusBadge } from '@/components/instructor/CourseStatusBadge';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar, Badge, buttonStyles, Card, CardHeader, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { fetchInstructorDashboard } from '@/features/instructors/instructorSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/selectors';
import { formatCompact, formatCurrency, timeAgo } from '@/utils/format';
import { staggerChildren } from '@/utils/motion';

interface Activity { id: string; icon: LucideIcon; title: string; description: string; at: string; status: string }

export default function InstructorDashboard() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const { data, status, error } = useAppSelector((state) => state.instructors.dashboard);
  const { items: courses, reviews, status: coursesStatus } = useAppSelector((state) => state.courses);
  const enrollments = useAppSelector((state) => state.enrollment.items);
  const students = useAppSelector((state) => state.students.items);
  const userId = user?.id;

  useEffect(() => {
    if (userId) void dispatch(fetchInstructorDashboard(userId));
  }, [dispatch, userId, courses]);

  const own = useMemo(() => courses.filter((c) => c.instructorId === userId), [courses, userId]);
  const ownIds = useMemo(() => new Set(own.map((c) => c.id)), [own]);
  const mine = useMemo(() => enrollments.filter((e) => ownIds.has(e.courseId)), [enrollments, ownIds]);
  const nameOf = useCallback((id: string): string => students.find((s) => s.id === id)?.name ?? 'A student', [students]);
  const titleOf = useCallback((id: string): string => own.find((c) => c.id === id)?.title ?? 'a course', [own]);

  const recentEnrollments = useMemo(() => [...mine].sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt)).slice(0, 5), [mine]);
  const completedCourses = mine.filter((e) => e.status === 'completed').length;
  const activeStudents = new Set(mine.filter((e) => Date.now() - new Date(e.lastAccessedAt).getTime() < 14 * 86_400_000).map((e) => e.studentId)).size;

  const activity = useMemo<Activity[]>(() => {
    const list: Activity[] = [
      ...mine.slice().sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt)).slice(0, 4).map((e) => ({ id: `en-${e.id}`, icon: UserPlus, title: 'New student enrolled', description: `${nameOf(e.studentId)} enrolled in ${titleOf(e.courseId)}`, at: e.enrolledAt, status: 'New' })),
      ...mine.filter((e) => e.status === 'completed').slice(0, 3).map((e) => ({ id: `co-${e.id}`, icon: CheckCircle2, title: 'Course completed', description: `${nameOf(e.studentId)} completed ${titleOf(e.courseId)}`, at: e.lastAccessedAt, status: 'Completed' })),
      ...reviews.filter((r) => ownIds.has(r.courseId)).slice(0, 3).map((r) => ({ id: `rv-${r.id}`, icon: MessageSquare, title: 'New review received', description: `${nameOf(r.studentId)} rated ${titleOf(r.courseId)} ${r.rating} out of 5`, at: r.createdAt, status: `${r.rating} stars` })),
      ...mine.filter((e) => e.status === 'in-progress' && e.progress >= 60).slice(0, 2).map((e) => ({ id: `as-${e.id}`, icon: ClipboardCheck, title: 'Assignment submitted', description: `${nameOf(e.studentId)} submitted work in ${titleOf(e.courseId)}`, at: e.lastAccessedAt, status: 'Needs review' })),
      ...own.filter((c) => c.status === 'published').slice(0, 2).map((c) => ({ id: `pb-${c.id}`, icon: BookCheck, title: 'Course published', description: c.title, at: c.updatedAt ?? c.createdAt, status: 'Live' })),
    ];
    return list.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
  }, [mine, reviews, own, ownIds, nameOf, titleOf]);

  const top = useMemo(() => (data ? [...data.performance].sort((a, b) => b.revenue - a.revenue).slice(0, 4) : []), [data]);

  if (status === 'failed') return <ErrorState message={error ?? undefined} onRetry={() => userId && void dispatch(fetchInstructorDashboard(userId))} />;
  const ready = status === 'succeeded' && data && coursesStatus === 'succeeded';

  return (
    <>
      <PageHeader title="Instructor dashboard" description="How your courses are performing." actions={<Link to="/instructor/courses/create" className={buttonStyles('primary')}><PlusCircle className="mr-2 h-4 w-4" aria-hidden />Create course</Link>} />

      {!ready ? (
        <div className="space-y-6" aria-busy="true"><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div><Skeleton className="h-72 rounded-2xl" /></div>
      ) : own.length === 0 ? (
        <Card><EmptyState icon={Library} title="Welcome! Create your first course" description="Your dashboard fills with enrolments, revenue and reviews once you publish." action={<Link to="/instructor/courses/create" className={buttonStyles('primary')}>Create course</Link>} /></Card>
      ) : (
        <>
          <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Total courses" value={String(data.kpis.totalCourses)} icon={Library} hint={`${data.kpis.archived} archived`} />
            <StatCard label="Published" value={String(data.kpis.published)} icon={BookCheck} />
            <StatCard label="Drafts" value={String(data.kpis.drafts)} icon={FileEdit} />
            <StatCard label="Total students" value={formatCompact(data.kpis.students)} icon={Users} />
            <StatCard label="Total enrollments" value={formatCompact(data.kpis.enrollments)} icon={GraduationCap} />
            <StatCard label="Average rating" value={data.kpis.rating ? data.kpis.rating.toFixed(1) : 'No ratings'} icon={Star} />
            <StatCard label="Total revenue" value={formatCurrency(data.kpis.revenue)} icon={DollarSign} hint="Last 12 months (demo)" />
            <StatCard label="Completion rate" value={`${data.kpis.completionRate}%`} icon={TrendingUp} />
          </motion.div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card><CardHeader title="Enrollment trend" subtitle="New enrolments per month" /><AreaTrendChart data={data.enrollmentTrend} xKey="label" yKey="enrollments" label="Monthly enrolments" format={(v) => formatCompact(v)} /></Card>
            <Card><CardHeader title="Revenue trend" subtitle="Monthly revenue" /><AreaTrendChart data={data.revenueTrend} xKey="label" yKey="revenue" label="Monthly revenue" format={(v) => `$${formatCompact(v)}`} /></Card>
            <Card><CardHeader title="Course performance" subtitle="Enrolments and completion rate" /><CoursePerformanceChart data={data.performance.map((p) => ({ name: p.title.split(/[:&-]/)[0].trim(), enrollments: p.enrollments, completionRate: p.completionRate }))} /></Card>
            <Card>
              <CardHeader title="Student activity" subtitle="Across your courses" />
              <dl className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-subtle p-3"><dt className="text-muted">Active students (14 days)</dt><dd className="mt-0.5 text-xl font-bold text-fg">{activeStudents}</dd></div><div className="rounded-xl bg-subtle p-3"><dt className="text-muted">Courses completed</dt><dd className="mt-0.5 text-xl font-bold text-fg">{completedCourses}</dd></div></dl>
              <h3 className="mb-2 mt-5 text-sm font-semibold text-fg">Recent enrollments</h3>
              {recentEnrollments.length === 0 ? <p className="text-sm text-muted">No enrollments yet.</p> : (
                <ul className="space-y-3">{recentEnrollments.map((e) => <li key={e.id} className="flex items-center gap-3"><Avatar name={nameOf(e.studentId)} size="sm" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-fg">{nameOf(e.studentId)}</span><span className="block truncate text-xs text-muted">{titleOf(e.courseId)}</span></span><span className="text-xs text-muted">{timeAgo(e.enrolledAt)}</span></li>)}</ul>
              )}
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Top performing courses" action={<Link to="/instructor/courses" className="text-sm font-medium text-brand-text hover:underline">All courses</Link>} />
              {top.length === 0 ? <EmptyState icon={Archive} title="No performance data yet" description="Publish a course to start seeing results." /> : (
                <ul className="divide-y divide-line">
                  {top.map((p) => {
                    const c = own.find((x) => x.id === p.courseId);
                    if (!c) return null;
                    return (
                      <li key={p.courseId} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                        <CourseThumbnail src={c.thumbnail} alt="" className="aspect-video w-full rounded-lg sm:h-16 sm:w-28" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2"><p className="font-medium text-fg">{c.title}</p><CourseStatusBadge status={c.status} /></div>
                          <p className="text-xs text-muted">{c.category}</p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted"><span>{formatCompact(p.enrollments)} students</span>{c.rating > 0 && <Rating value={c.rating} />}<span>{formatCurrency(p.revenue)} revenue</span><span>{p.completionRate}% completion</span></p>
                        </div>
                        <Link to={`/instructor/courses/${c.id}/preview`} className={buttonStyles('outline', 'sm')}>View Course</Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
            <Card>
              <CardHeader title="Recent activity" />
              {activity.length === 0 ? <p className="text-sm text-muted">No recent activity.</p> : (
                <ul className="space-y-4">
                  {activity.map((a) => (
                    <li key={a.id} className="flex gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand-text"><a.icon className="h-[18px] w-[18px]" aria-hidden /></span>
                      <div className="min-w-0 flex-1"><p className="text-sm font-medium text-fg">{a.title}</p><p className="truncate text-xs text-muted">{a.description}</p><p className="mt-0.5 text-[11px] text-muted">{timeAgo(a.at)}</p></div>
                      <Badge>{a.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}
