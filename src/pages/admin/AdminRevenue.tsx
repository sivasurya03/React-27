import { useMemo, useState } from 'react';
import { Download, Receipt, Search, SearchX } from 'lucide-react';
import { AreaTrendChart, BarTrendChart } from '@/components/charts/TrendCharts';
import { GroupedBarChart, PieShareChart } from '@/components/charts/MultiCharts';
import { PaymentBadge } from '@/components/admin/AdminBadges';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card, CardHeader, EmptyState, ErrorState, Input, Pagination, Select, Skeleton, Table, useToast, type Column } from '@/components/ui';
import { useAdminOverview } from '@/hooks/useAdminOverview';
import { useAppSelector } from '@/store/hooks';
import type { TransactionRow } from '@/utils/adminInsights';
import { downloadCsv } from '@/utils/csv';
import { formatCompact, formatCurrency, formatDate, netPrice } from '@/utils/format';

const PAGE_SIZE = 10;

export default function AdminRevenue() {
  const toast = useToast();
  const { stats, transactions, status, error, retry } = useAdminOverview();
  const courses = useAppSelector((s) => s.courses.items);
  const [q, setQ] = useState('');
  const [txStatus, setTxStatus] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const byCourse = useMemo(() => courses.filter((c) => c.studentsCount > 0).map((c) => ({ name: c.title.split(/[:&-]/)[0].trim().slice(0, 16), revenue: Math.round(c.studentsCount * netPrice(c.price, c.discount)) })).sort((a, b) => b.revenue - a.revenue).slice(0, 8), [courses]);
  const byCategory = useMemo(() => {
    const totals = new Map<string, number>();
    courses.forEach((c) => totals.set(c.category, (totals.get(c.category) ?? 0) + Math.round(c.studentsCount * netPrice(c.price, c.discount))));
    return [...totals].filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [courses]);

  const invalidRange = Boolean(from && to && from > to);
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const start = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity;
    const end = to ? new Date(`${to}T23:59:59`).getTime() : Infinity;
    return transactions.filter((t) => {
      const time = new Date(t.date).getTime();
      return (!term || [t.id, t.student, t.courseTitle, t.instructorName].some((v) => v.toLowerCase().includes(term))) && (txStatus === 'all' || t.status === txStatus) && (invalidRange || (time >= start && time <= end));
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, q, txStatus, from, to, invalidRange]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const today = stats ? Math.round(stats.totals.monthlyRevenue / 30 + transactions.filter((t) => new Date(t.date).toDateString() === new Date().toDateString() && t.status !== 'refunded' && t.status !== 'failed').reduce((s, t) => s + t.gross, 0)) : 0;
  const net = stats ? stats.totals.revenue - stats.totals.refunds : 0;
  const aov = stats && stats.totals.enrollments ? stats.totals.revenue / stats.totals.enrollments : 0;

  const columns: Column<TransactionRow>[] = [
    { key: 'id', header: 'Transaction', cell: (t) => <span className="font-mono text-xs">{t.id}</span> },
    { key: 'date', header: 'Date', cell: (t) => formatDate(t.date) },
    { key: 'student', header: 'Student', cell: (t) => t.student },
    { key: 'course', header: 'Course', className: 'min-w-44', cell: (t) => <span className="line-clamp-2">{t.courseTitle}</span> },
    { key: 'instructor', header: 'Instructor', cell: (t) => t.instructorName },
    { key: 'gross', header: 'Gross', cell: (t) => formatCurrency(t.gross) },
    { key: 'fee', header: 'Platform fee', cell: (t) => formatCurrency(t.fee) },
    { key: 'earn', header: 'Instructor earnings', cell: (t) => formatCurrency(t.instructorEarnings) },
    { key: 'net', header: 'Net revenue', cell: (t) => <span className="font-medium text-fg">{formatCurrency(t.net)}</span> },
    { key: 'status', header: 'Status', cell: (t) => <PaymentBadge status={t.status} /> },
  ];

  if (status === 'failed') return <ErrorState message={error ?? undefined} onRetry={retry} />;

  return (
    <>
      <PageHeader title="Revenue" description="Platform revenue, refunds and transactions." actions={<Button variant="outline" disabled={rows.length === 0} leftIcon={<Download className="h-4 w-4" />} onClick={() => { downloadCsv('transactions', ['Transaction', 'Date', 'Student', 'Course', 'Instructor', 'Gross', 'Platform fee', 'Instructor earnings', 'Net revenue', 'Status'], rows.map((t) => [t.id, formatDate(t.date), t.student, t.courseTitle, t.instructorName, t.gross.toFixed(2), t.fee.toFixed(2), t.instructorEarnings.toFixed(2), t.net.toFixed(2), t.status])); toast.success('CSV exported', `${rows.length} transactions`); }}>Export CSV</Button>} />
      <p className="mb-5 rounded-xl border border-line bg-subtle px-4 py-3 text-sm text-muted">Demo data: financial figures are generated for this frontend demo. Summary cards are platform-scale; the table lists the enrollments recorded in this demo.</p>

      {!stats ? (
        <div className="space-y-4" aria-busy="true"><div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div><Skeleton className="h-72 rounded-2xl" /></div>
      ) : (
        <div className="space-y-6">
          <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
            {[['Total revenue', stats.totals.revenue], ['Monthly revenue', stats.totals.monthlyRevenue], ["Today's revenue", today], ['Refunds', stats.totals.refunds], ['Net revenue', net], ['Avg. order value', aov]].map(([label, value]) => <Card key={label as string}><dt className="text-sm text-muted">{label}</dt><dd className="mt-1.5 text-xl font-bold tracking-tight text-fg sm:text-2xl">{formatCurrency(Math.round((value as number) * 100) / 100)}</dd></Card>)}
          </dl>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card><CardHeader title="Revenue trend" subtitle="Last 12 months" /><AreaTrendChart data={stats.revenueSeries} xKey="month" yKey="revenue" label="Revenue trend" format={(v) => `$${formatCompact(v)}`} /></Card>
            <Card><CardHeader title="Monthly comparison" subtitle="Gross revenue and net after refunds" /><GroupedBarChart data={stats.revenueSeries} xKey="month" series={[{ key: 'revenue', label: 'Gross' }, { key: 'net', label: 'Net' }]} label="Gross and net revenue by month" format={(v) => `$${formatCompact(v)}`} /></Card>
            <Card><CardHeader title="Revenue by course" subtitle="Top 8 courses" /><BarTrendChart data={byCourse} xKey="name" yKey="revenue" label="Revenue by course" format={(v) => `$${formatCompact(v)}`} /></Card>
            <Card><CardHeader title="Revenue by category" /><PieShareChart data={byCategory} label="Revenue by category" format={(v) => formatCurrency(v)} /></Card>
          </div>

          <Card>
            <CardHeader title="Transactions" subtitle={`${rows.length} matching`} />
            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Input type="search" aria-label="Search transactions" placeholder="Search transactions" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} leftIcon={<Search className="h-4 w-4" />} />
              <Select aria-label="Filter by status" value={txStatus} onChange={(e) => { setTxStatus(e.target.value); setPage(1); }} options={[{ value: 'all', label: 'All statuses' }, { value: 'paid', label: 'Paid' }, { value: 'pending', label: 'Pending' }, { value: 'refunded', label: 'Refunded' }, { value: 'failed', label: 'Failed' }]} />
              <Input type="date" aria-label="From date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
              <Input type="date" aria-label="To date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(1); }} error={invalidRange ? 'End date must be after the start date.' : undefined} />
            </div>
            {rows.length === 0 ? <EmptyState icon={q || txStatus !== 'all' || from || to ? SearchX : Receipt} title="No transactions found" description="Try changing your search or filters." action={<Button onClick={() => { setQ(''); setTxStatus('all'); setFrom(''); setTo(''); }}>Clear filters</Button>} /> : <Table columns={columns} rows={visible} rowKey={(t) => t.id} />}
          </Card>
          <Pagination page={current} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </>
  );
}
