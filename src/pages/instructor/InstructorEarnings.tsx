import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Landmark, Receipt, SearchX } from 'lucide-react';
import { AreaTrendChart } from '@/components/charts/TrendCharts';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, Button, buttonStyles, Card, CardHeader, EmptyState, ErrorState, Input, Pagination, Select, Skeleton, Table, useToast, type BadgeVariant, type Column } from '@/components/ui';
import { fetchInstructorEarnings } from '@/features/instructors/instructorSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/selectors';
import type { EarningsTransaction, TransactionStatus } from '@/types';
import { formatCompact, formatCurrency, formatDate } from '@/utils/format';

const PAGE_SIZE = 10;
const STATUS: Record<TransactionStatus, BadgeVariant> = { completed: 'success', pending: 'warning', refunded: 'danger' };

const csvCell = (value: string | number): string => `"${String(value).replace(/"/g, '""')}"`;

function downloadCsv(rows: EarningsTransaction[]): void {
  const header = ['Date', 'Student', 'Course', 'Amount', 'Platform fee', 'Net earnings', 'Status'];
  const lines = rows.map((t) => [formatDate(t.date), t.student, t.courseTitle, t.amount.toFixed(2), t.fee.toFixed(2), t.net.toFixed(2), t.status].map(csvCell).join(','));
  const url = URL.createObjectURL(new Blob([[header.map(csvCell).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `earnings-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function InstructorEarnings() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const user = useAppSelector(selectCurrentUser);
  const { data, status, error } = useAppSelector((state) => state.instructors.earnings);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [courseId, setCourseId] = useState('all');
  const [txStatus, setTxStatus] = useState('all');
  const [page, setPage] = useState(1);
  const userId = user?.id;

  useEffect(() => {
    if (userId) void dispatch(fetchInstructorEarnings(userId));
  }, [dispatch, userId]);

  const courseOptions = useMemo(() => {
    const seen = new Map<string, string>();
    data?.transactions.forEach((t) => seen.set(t.courseId, t.courseTitle));
    return [...seen].map(([value, label]) => ({ value, label }));
  }, [data]);

  const rows = useMemo(() => {
    const start = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity;
    const end = to ? new Date(`${to}T23:59:59`).getTime() : Infinity;
    return (data?.transactions ?? []).filter((t) => {
      const time = new Date(t.date).getTime();
      return time >= start && time <= end && (courseId === 'all' || t.courseId === courseId) && (txStatus === 'all' || t.status === txStatus);
    });
  }, [data, from, to, courseId, txStatus]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const invalidRange = Boolean(from && to && from > to);

  const columns: Column<EarningsTransaction>[] = [
    { key: 'date', header: 'Date', cell: (t) => formatDate(t.date) },
    { key: 'student', header: 'Student', cell: (t) => t.student },
    { key: 'course', header: 'Course', className: 'min-w-48', cell: (t) => <span className="line-clamp-2">{t.courseTitle}</span> },
    { key: 'amount', header: 'Amount', cell: (t) => formatCurrency(t.amount) },
    { key: 'fee', header: 'Platform fee', cell: (t) => formatCurrency(t.fee) },
    { key: 'net', header: 'Net earnings', cell: (t) => <span className="font-medium text-fg">{formatCurrency(t.net)}</span> },
    { key: 'status', header: 'Status', cell: (t) => <Badge variant={STATUS[t.status]}>{t.status[0].toUpperCase() + t.status.slice(1)}</Badge> },
  ];

  if (status === 'failed') return <ErrorState message={error ?? undefined} onRetry={() => userId && void dispatch(fetchInstructorEarnings(userId))} />;

  return (
    <>
      <PageHeader title="Earnings" description="Your revenue, payouts and transactions." actions={<Button variant="outline" disabled={rows.length === 0} leftIcon={<Download className="h-4 w-4" />} onClick={() => { downloadCsv(rows); toast.success('CSV exported', `${rows.length} transactions`); }}>Export CSV</Button>} />
      <p className="mb-5 rounded-xl border border-line bg-subtle px-4 py-3 text-sm text-muted">Demo data: earnings and transactions are generated for this frontend demo. No real payments are processed.</p>

      {status !== 'succeeded' || !data ? (
        <div className="space-y-4" aria-busy="true"><div className="grid grid-cols-2 gap-4 lg:grid-cols-5">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div><Skeleton className="h-72 rounded-2xl" /></div>
      ) : data.transactions.length === 0 ? (
        <Card><EmptyState icon={Landmark} title="No earnings yet" description="Earnings appear once students purchase your courses." action={<Link to="/instructor/courses" className={buttonStyles('primary')}>View my courses</Link>} /></Card>
      ) : (
        <div className="space-y-6">
          <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            {[['Total earnings', data.summary.total], ['This month', data.summary.thisMonth], ['Last month', data.summary.lastMonth], ['Pending', data.summary.pending], ['Withdrawable', data.summary.withdrawable]].map(([label, value]) => (
              <Card key={label as string}><dt className="text-sm text-muted">{label}</dt><dd className="mt-1.5 text-2xl font-bold tracking-tight text-fg">{formatCurrency(value as number)}</dd></Card>
            ))}
          </dl>
          <Card><CardHeader title="Monthly earnings" subtitle="Net of the 20% platform fee" /><AreaTrendChart data={data.monthly} xKey="month" yKey="revenue" label="Monthly net earnings" format={(v) => `$${formatCompact(v)}`} /></Card>

          <Card>
            <CardHeader title="Transactions" subtitle={`${rows.length} matching`} />
            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Input type="date" label="From" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
              <Input type="date" label="To" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(1); }} error={invalidRange ? 'End date must be after the start date.' : undefined} />
              <Select label="Course" value={courseId} onChange={(e) => { setCourseId(e.target.value); setPage(1); }} options={[{ value: 'all', label: 'All courses' }, ...courseOptions]} />
              <Select label="Status" value={txStatus} onChange={(e) => { setTxStatus(e.target.value); setPage(1); }} options={[{ value: 'all', label: 'All statuses' }, { value: 'completed', label: 'Completed' }, { value: 'pending', label: 'Pending' }, { value: 'refunded', label: 'Refunded' }]} />
            </div>
            {rows.length === 0 ? (
              <EmptyState icon={from || to || courseId !== 'all' || txStatus !== 'all' ? SearchX : Receipt} title="No transactions found" description="Try widening the date range or clearing filters." action={<Button onClick={() => { setFrom(''); setTo(''); setCourseId('all'); setTxStatus('all'); }}>Clear filters</Button>} />
            ) : <Table columns={columns} rows={visible} rowKey={(t) => t.id} />}
          </Card>
          <Pagination page={current} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </>
  );
}
