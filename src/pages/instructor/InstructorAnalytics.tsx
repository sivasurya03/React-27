import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { AreaTrendChart, BarTrendChart } from '@/components/charts/TrendCharts';
import { CoursePerformanceChart, LineTrendChart } from '@/components/charts/MultiCharts';
import { PageHeader } from '@/components/layout/PageHeader';
import { buttonStyles, Button, Card, CardHeader, EmptyState, ErrorState, Select, Skeleton } from '@/components/ui';
import { fetchInstructorAnalytics } from '@/features/instructors/instructorSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/selectors';
import type { AnalyticsPeriod } from '@/types';
import { cn } from '@/utils/cn';
import { formatCompact, formatCurrency } from '@/utils/format';

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: 'd7', label: '7 days' }, { value: 'd30', label: '30 days' }, { value: 'd90', label: '90 days' }, { value: 'y1', label: '1 year' },
];

export default function InstructorAnalytics() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const courses = useAppSelector((state) => state.courses);
  const { data, status, error } = useAppSelector((state) => state.instructors.analytics);
  const [period, setPeriod] = useState<AnalyticsPeriod>('d30');
  const [courseId, setCourseId] = useState('all');

  const selling = courses.items.filter((c) => c.instructorId === user?.id && c.studentsCount > 0);
  const hasCourses = selling.length > 0;
  const userId = user?.id;
  const coursesReady = courses.status === 'succeeded';

  useEffect(() => {
    if (userId && coursesReady && hasCourses) void dispatch(fetchInstructorAnalytics({ instructorId: userId, period, courseId }));
  }, [dispatch, userId, coursesReady, hasCourses, period, courseId]);

  const retry = (): void => { if (userId) void dispatch(fetchInstructorAnalytics({ instructorId: userId, period, courseId })); };

  if (courses.status === 'failed') return <ErrorState message={courses.error ?? undefined} />;
  const header = (
    <PageHeader title="Analytics" description="Enrolments, revenue and course performance over time." actions={
      <div role="radiogroup" aria-label="Time period" className="inline-flex rounded-xl border border-line bg-surface p-1">
        {PERIODS.map((p) => <button key={p.value} type="button" role="radio" aria-checked={period === p.value} onClick={() => setPeriod(p.value)} className={cn('rounded-lg px-3 py-1.5 text-sm font-medium transition', period === p.value ? 'bg-brand text-brand-fg' : 'text-muted hover:text-fg')}>{p.label}</button>)}
      </div>
    } />
  );

  if (coursesReady && !hasCourses) {
    return <>{header}<Card><EmptyState icon={BarChart3} title="No analytics data yet" description="Analytics appear once students enrol in one of your published courses." action={<Link to="/instructor/courses" className={buttonStyles('primary')}>View my courses</Link>} /></Card></>;
  }
  if (status === 'failed') return <>{header}<Card><ErrorState title="Analytics unavailable" message={error ?? undefined} onRetry={retry} /></Card></>;

  const refreshing = status === 'loading';
  const single = courseId !== 'all' ? data?.performance[0] : undefined;
  const perfRows = data?.performance.map((p) => ({ name: p.title.split(/[:&-]/)[0].trim(), enrollments: p.enrollments, completionRate: p.completionRate })) ?? [];

  return (
    <>
      {header}
      <div className="mb-5 max-w-sm">
        <Select aria-label="Select course" label="Course" value={courseId} onChange={(e) => setCourseId(e.target.value)} options={[{ value: 'all', label: 'All courses' }, ...selling.map((c) => ({ value: c.id, label: c.title }))]} />
      </div>

      {!data ? (
        <div className="space-y-4" aria-busy="true"><div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div><Skeleton className="h-72 rounded-2xl" /></div>
      ) : (
        <div className={cn('space-y-6 transition-opacity', refreshing && 'opacity-60')}>
          <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
            {[
              ['Enrollments', formatCompact(data.totals.enrollments)], ['Revenue', formatCurrency(data.totals.revenue)], ['Active students', formatCompact(data.totals.activeStudents)],
              ['Completion rate', `${data.totals.completionRate}%`], ['Avg. quiz score', `${data.totals.avgQuizScore}%`], ['Avg. rating', data.totals.avgRating ? data.totals.avgRating.toFixed(1) : 'No ratings'],
            ].map(([label, value]) => <Card key={label}><dt className="text-sm text-muted">{label}</dt><dd className="mt-1.5 text-2xl font-bold tracking-tight text-fg">{value}</dd></Card>)}
          </dl>

          {single && (
            <Card>
              <CardHeader title={single.title} subtitle="Course performance" />
              <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-6">
                {[['Lifetime enrollments', formatCompact(single.enrollments)], ['Active students', formatCompact(single.activeStudents)], ['Completion rate', `${single.completionRate}%`], ['Avg. quiz score', `${single.avgQuizScore}%`], ['Avg. rating', single.rating.toFixed(1)], ['Lifetime revenue', formatCurrency(single.revenue)]].map(([l, v]) => <div key={l}><dt className="text-muted">{l}</dt><dd className="mt-0.5 font-semibold text-fg">{v}</dd></div>)}
              </dl>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card><CardHeader title="Enrollment analytics" subtitle="New enrolments in the period" /><AreaTrendChart data={data.points} xKey="label" yKey="enrollments" label="Enrolments over time" format={(v) => formatCompact(v)} /></Card>
            <Card><CardHeader title="Revenue analytics" subtitle="Gross revenue in the period" /><AreaTrendChart data={data.points} xKey="label" yKey="revenue" label="Revenue over time" format={(v) => `$${formatCompact(v)}`} /></Card>
            <Card><CardHeader title="Student growth" subtitle="Cumulative students" /><LineTrendChart data={data.points} xKey="label" yKey="students" label="Cumulative students over time" format={(v) => formatCompact(v)} /></Card>
            {data.totals.avgRating > 0 && <Card><CardHeader title="Rating trend" subtitle="Average rating out of 5" /><LineTrendChart data={data.points} xKey="label" yKey="rating" label="Average rating over time" domain={[3.5, 5]} format={(v) => v.toFixed(1)} /></Card>}
            <Card><CardHeader title="Course performance" subtitle="Enrolments and completion rate" /><CoursePerformanceChart data={perfRows} /></Card>
            <Card><CardHeader title="Lesson engagement" subtitle={courseId === 'all' ? 'Completion rate by course' : 'Completion rate by chapter'} /><BarTrendChart data={data.engagement} xKey="label" yKey="value" label="Engagement by chapter or course" format={(v) => `${v}%`} /></Card>
          </div>
          <p className="text-xs text-muted">Analytics are demo data generated from your course totals.</p>
          {refreshing && <Button variant="ghost" loading disabled>Updating</Button>}
        </div>
      )}
    </>
  );
}
