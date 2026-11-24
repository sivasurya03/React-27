import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, BadgeCheck, BookCheck, CheckCircle2, ClipboardList, DollarSign, GraduationCap, Library, ShieldAlert, TrendingUp, Users } from 'lucide-react';
import { AreaTrendChart } from '@/components/charts/TrendCharts';
import { LineTrendChart } from '@/components/charts/MultiCharts';
import { CompletionBadge } from '@/components/admin/AdminBadges';
import { TrendStatCard } from '@/components/admin/TrendStatCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, Card, CardHeader, ErrorState, Skeleton, Table, type Column } from '@/components/ui';
import { useAdminOverview } from '@/hooks/useAdminOverview';
import { useAppSelector } from '@/store/hooks';
import type { EnrollmentRow } from '@/utils/adminInsights';
import { formatCompact, formatCurrency, formatDate, formatNumber } from '@/utils/format';
import { staggerChildren } from '@/utils/motion';

export default function AdminDashboard() {
  const { stats, rows, status, error, retry } = useAdminOverview();
  const courses = useAppSelector((s) => s.courses.items);
  const instructors = useAppSelector((s) => s.instructors.items);
  const students = useAppSelector((s) => s.students.items);

  const recent = useMemo(() => [...rows].sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt)).slice(0, 6), [rows]);
  const top = useMemo(() => [...courses].filter((c) => c.status === 'published').sort((a, b) => b.studentsCount - a.studentsCount).slice(0, 5), [courses]);
  const pendingCourses = courses.filter((c) => c.status === 'pending').length;
  const pendingInstructors = instructors.filter((i) => i.status === 'pending').length;
  const blocked = students.filter((s) => s.status === 'suspended' || s.status === 'deactivated').length;

  const columns: Column<EnrollmentRow>[] = [
    { key: 'student', header: 'Student', cell: (r) => r.studentName },
    { key: 'course', header: 'Course', className: 'min-w-48', cell: (r) => <span className="line-clamp-1">{r.courseTitle}</span> },
    { key: 'date', header: 'Enrolled', cell: (r) => formatDate(r.enrolledAt) },
    { key: 'amount', header: 'Amount', cell: (r) => formatCurrency(r.amount) },
    { key: 'status', header: 'Status', cell: (r) => <CompletionBadge status={r.completion} /> },
  ];

  if (status === 'failed') return <ErrorState message={error ?? undefined} onRetry={retry} />;

  return (
    <>
      <PageHeader title="Admin dashboard" description="Platform health, growth and what needs your attention." />
      {!stats ? (
        <div className="space-y-6" aria-busy="true"><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div><Skeleton className="h-72 rounded-2xl" /></div>
      ) : (
        <>
          <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <TrendStatCard label="Total students" value={formatNumber(stats.totals.students)} change={stats.changes.students} icon={Users} />
            <TrendStatCard label="Total instructors" value={formatNumber(stats.totals.instructors)} change={stats.changes.instructors} icon={GraduationCap} />
            <TrendStatCard label="Total courses" value={formatNumber(stats.totals.courses)} change={stats.changes.courses} icon={Library} />
            <TrendStatCard label="Total enrollments" value={formatNumber(stats.totals.enrollments)} change={stats.changes.enrollments} icon={ClipboardList} />
            <TrendStatCard label="Active courses" value={formatNumber(stats.totals.activeCourses)} change={stats.changes.activeCourses} icon={BookCheck} hint="published" />
            <TrendStatCard label="Completed courses" value={formatNumber(stats.totals.completed)} change={stats.changes.completed} icon={CheckCircle2} />
            <TrendStatCard label="Total revenue" value={formatCurrency(stats.totals.revenue)} change={stats.changes.revenue} icon={DollarSign} />
            <TrendStatCard label="Monthly revenue" value={formatCurrency(stats.totals.monthlyRevenue)} change={stats.changes.monthlyRevenue} icon={TrendingUp} />
          </motion.div>
          <p className="mt-3 text-xs text-muted">Platform totals are demo-scale figures derived from the course catalogue, plus live activity from this browser session.</p>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2"><CardHeader title="Revenue trend" subtitle="Monthly revenue, last 12 months" /><AreaTrendChart data={stats.revenueSeries} xKey="month" yKey="revenue" label="Monthly revenue" format={(v) => `$${formatCompact(v)}`} /></Card>
            <Card>
              <CardHeader title="Needs attention" />
              <ul className="space-y-3 text-sm">
                <li><Link to="/admin/courses?status=pending" className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 transition hover:bg-subtle"><span className="flex items-center gap-2 text-fg"><BadgeCheck className="h-4 w-4 text-amber-500" aria-hidden />Courses awaiting review</span><Badge variant={pendingCourses ? 'warning' : 'neutral'}>{pendingCourses}</Badge></Link></li>
                <li><Link to="/admin/instructors" className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 transition hover:bg-subtle"><span className="flex items-center gap-2 text-fg"><AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />Instructors pending approval</span><Badge variant={pendingInstructors ? 'warning' : 'neutral'}>{pendingInstructors}</Badge></Link></li>
                <li><Link to="/admin/students" className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 transition hover:bg-subtle"><span className="flex items-center gap-2 text-fg"><ShieldAlert className="h-4 w-4 text-rose-500" aria-hidden />Suspended or closed accounts</span><Badge variant={blocked ? 'danger' : 'neutral'}>{blocked}</Badge></Link></li>
              </ul>
              <h3 className="mb-2 mt-5 text-sm font-semibold text-fg">Top courses</h3>
              <ol className="space-y-2 text-sm">{top.map((c, i) => <li key={c.id} className="flex items-center gap-2"><span className="w-4 text-muted">{i + 1}</span><span className="min-w-0 flex-1 truncate text-fg">{c.title}</span><span className="text-xs text-muted">{formatCompact(c.studentsCount)}</span></li>)}</ol>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card><CardHeader title="Enrollment trend" subtitle="New enrollments per month" /><AreaTrendChart data={stats.enrollmentSeries} xKey="month" yKey="enrollments" label="Monthly enrollments" format={(v) => formatCompact(v)} /></Card>
            <Card><CardHeader title="Student growth" subtitle="Registered students over time" /><LineTrendChart data={stats.studentSeries} xKey="month" yKey="students" label="Student growth" format={(v) => formatCompact(v)} /></Card>
          </div>

          <Card className="mt-6">
            <CardHeader title="Recent enrollments" action={<Link to="/admin/enrollments" className="text-sm font-medium text-brand-text hover:underline">View all</Link>} />
            <Table columns={columns} rows={recent} rowKey={(r) => r.id} emptyTitle="No enrollments yet" />
          </Card>
        </>
      )}
    </>
  );
}
