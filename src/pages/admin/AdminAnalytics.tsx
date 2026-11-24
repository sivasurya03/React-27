import { useEffect, useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { AreaTrendChart } from '@/components/charts/TrendCharts';
import { CoursePerformanceChart, LineTrendChart, PieShareChart } from '@/components/charts/MultiCharts';
import { Rating } from '@/components/courses/Rating';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, EmptyState, ErrorState, Skeleton, Table, type Column } from '@/components/ui';
import { fetchAdminAnalytics } from '@/features/admin/adminSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { AdminAnalytics as Analytics, AnalyticsPeriod } from '@/types';
import { cn } from '@/utils/cn';
import { formatCompact, formatCurrency } from '@/utils/format';

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [{ value: 'd7', label: '7D' }, { value: 'd30', label: '30D' }, { value: 'd90', label: '90D' }, { value: 'y1', label: '1Y' }];
type InstructorRow = Analytics['instructors'][number];

export default function AdminAnalytics() {
  const dispatch = useAppDispatch();
  const courses = useAppSelector((s) => s.courses.items);
  const { data, status, error } = useAppSelector((s) => s.admin.analytics);
  const [period, setPeriod] = useState<AnalyticsPeriod>('d30');

  useEffect(() => {
    void dispatch(fetchAdminAnalytics(period));
  }, [dispatch, period, courses]);

  const students = useMemo(() => data?.points.map((p) => ({ label: p.label, students: Math.round(p.students * 0.64) })) ?? [], [data]);
  const topCourses = useMemo(() => (data?.courses ?? []).slice(0, 8), [data]);
  const categories = useMemo(() => data?.category.filter((c) => c.courses > 0) ?? [], [data]);

  const instructorColumns: Column<InstructorRow>[] = [
    { key: 'name', header: 'Instructor', cell: (i) => <span className="font-medium text-fg">{i.name}</span> },
    { key: 'courses', header: 'Courses', cell: (i) => i.courses },
    { key: 'students', header: 'Students', cell: (i) => formatCompact(i.students) },
    { key: 'revenue', header: 'Revenue', cell: (i) => formatCurrency(i.revenue) },
    { key: 'rating', header: 'Rating', cell: (i) => (i.rating > 0 ? <Rating value={i.rating} /> : <span className="text-muted">No ratings</span>) },
  ];

  const header = (
    <PageHeader title="Analytics" description="Growth, engagement and performance across the platform." actions={
      <div role="radiogroup" aria-label="Time period" className="inline-flex rounded-xl border border-line bg-surface p-1">
        {PERIODS.map((p) => <button key={p.value} type="button" role="radio" aria-checked={period === p.value} onClick={() => setPeriod(p.value)} className={cn('rounded-lg px-3 py-1.5 text-sm font-medium transition', period === p.value ? 'bg-brand text-brand-fg' : 'text-muted hover:text-fg')}>{p.label}</button>)}
      </div>
    } />
  );

  const refreshing = status === 'loading';
  if (status === 'failed') return <>{header}<Card><ErrorState title="Analytics unavailable" message={error ?? undefined} onRetry={() => void dispatch(fetchAdminAnalytics(period))} /></Card></>;
  if (!data) return <>{header}<div className="grid gap-6 lg:grid-cols-2" aria-busy="true">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}</div></>;
  if (data.courses.length === 0) return <>{header}<Card><EmptyState icon={BarChart3} title="No analytics data yet" description="Analytics appear once courses have enrolled students." /></Card></>;

  return (
    <>
      {header}
      <div className={cn('grid gap-6 transition-opacity lg:grid-cols-2', refreshing && 'opacity-60')}>
        <Card><CardHeader title="Enrollment trend" subtitle="New enrollments in the period" /><AreaTrendChart data={data.points} xKey="label" yKey="enrollments" label="Enrollment trend" format={(v) => formatCompact(v)} /></Card>
        <Card><CardHeader title="Revenue trend" subtitle="Gross revenue in the period" /><AreaTrendChart data={data.points} xKey="label" yKey="revenue" label="Revenue trend" format={(v) => `$${formatCompact(v)}`} /></Card>
        <Card><CardHeader title="Student growth" subtitle="Registered students" /><LineTrendChart data={students} xKey="label" yKey="students" label="Student growth" format={(v) => formatCompact(v)} /></Card>
        <Card><CardHeader title="Course performance" subtitle="Top courses by enrollments, with completion rate" /><CoursePerformanceChart data={topCourses.map((c) => ({ name: c.title.split(/[:&-]/)[0].trim(), enrollments: c.enrollments, completionRate: c.completionRate }))} /></Card>
        <Card><CardHeader title="Course distribution" subtitle="Courses per category" /><PieShareChart data={categories.map((c) => ({ name: c.category, value: c.courses }))} label="Courses by category" /></Card>
        <Card><CardHeader title="Enrollment distribution" subtitle="Enrollments per category" /><PieShareChart data={categories.filter((c) => c.enrollments > 0).map((c) => ({ name: c.category, value: c.enrollments }))} label="Enrollments by category" format={(v) => formatCompact(v)} /></Card>
      </div>
      <Card className="mt-6">
        <CardHeader title="Top courses" subtitle="Ratings and completion" />
        <Table columns={[
          { key: 'title', header: 'Course', className: 'min-w-56', cell: (c) => <span className="line-clamp-2 font-medium text-fg">{c.title}</span> },
          { key: 'enrollments', header: 'Enrollments', cell: (c) => formatCompact(c.enrollments) },
          { key: 'completion', header: 'Completion', cell: (c) => `${c.completionRate}%` },
          { key: 'rating', header: 'Rating', cell: (c) => (c.rating > 0 ? <Rating value={c.rating} /> : <span className="text-muted">No ratings</span>) },
        ]} rows={topCourses} rowKey={(c) => c.courseId} />
      </Card>
      <Card className="mt-6">
        <CardHeader title="Instructor performance" subtitle="Ranked by revenue" />
        <Table columns={instructorColumns} rows={data.instructors.slice(0, 8)} rowKey={(i) => i.id} />
      </Card>
      <p className="mt-4 text-xs text-muted">Analytics are demo data generated from the course catalogue.</p>
    </>
  );
}
