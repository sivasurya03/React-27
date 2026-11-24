import { useState } from 'react';
import { Download, FileBarChart, Printer } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card, CardHeader, EmptyState, Input, Select, Table, useToast, type Column } from '@/components/ui';
import { useAdminOverview } from '@/hooks/useAdminOverview';
import { useAppSelector } from '@/store/hooks';
import { COURSE_CATEGORIES } from '@/types';
import { buildReport, type Report, type ReportType } from '@/utils/adminReports';
import { downloadCsv } from '@/utils/csv';
import { formatDate } from '@/utils/format';

const TYPES: { value: ReportType; label: string; description: string }[] = [
  { value: 'students', label: 'Student report', description: 'Registrations, active students, completions and growth' },
  { value: 'courses', label: 'Course report', description: 'Published courses, enrollments, completion and ratings' },
  { value: 'instructors', label: 'Instructor report', description: 'Active instructors, courses, students and earnings' },
  { value: 'revenue', label: 'Revenue report', description: 'Gross revenue, refunds, net revenue and transactions' },
];

export default function AdminReports() {
  const toast = useToast();
  const { rows, transactions } = useAdminOverview();
  const students = useAppSelector((s) => s.students.items);
  const instructors = useAppSelector((s) => s.instructors.items);
  const courses = useAppSelector((s) => s.courses.items);
  const [type, setType] = useState<ReportType>('students');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [category, setCategory] = useState('all');
  const [error, setError] = useState<string>();
  const [report, setReport] = useState<Report | null>(null);

  const generate = (): void => {
    if (from && to && from > to) { setError('The end date must be after the start date.'); return; }
    setError(undefined);
    setReport(buildReport(type, { from, to, category }, { students, instructors, courses, rows, transactions }));
    toast.success('Report generated');
  };

  const columns: Column<(string | number)[]>[] = (report?.headers ?? []).map((header, index) => ({ key: header, header, cell: (row) => String(row[index]) }));

  return (
    <>
      <PageHeader title="Reports" description="Generate, export and print platform reports." />
      <Card className="print:hidden">
        <CardHeader title="Report builder" subtitle={TYPES.find((t) => t.value === type)?.description} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Report type" value={type} onChange={(e) => { setType(e.target.value as ReportType); setReport(null); }} options={TYPES.map((t) => ({ value: t.value, label: t.label }))} />
          <Input type="date" label="From" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setError(undefined); }} />
          <Input type="date" label="To" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setError(undefined); }} error={error} />
          {type === 'courses' ? <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)} options={[{ value: 'all', label: 'All categories' }, ...COURSE_CATEGORIES.map((c) => ({ value: c, label: c }))]} /> : <div />}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button leftIcon={<FileBarChart className="h-4 w-4" />} onClick={generate}>Generate report</Button>
          <Button variant="outline" disabled={!report || report.rows.length === 0} leftIcon={<Download className="h-4 w-4" />} onClick={() => report && downloadCsv(report.title.toLowerCase().replace(/\s+/g, '-'), report.headers, report.rows)}>Export CSV</Button>
          <Button variant="outline" disabled={!report} leftIcon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>Print report</Button>
        </div>
        <p className="mt-3 text-xs text-muted">PDF export is not available in this demo. Use Print and choose “Save as PDF” in your browser.</p>
      </Card>

      {!report ? (
        <Card className="mt-6"><EmptyState icon={FileBarChart} title="No report generated yet" description="Choose a report type and date range, then select Generate report." /></Card>
      ) : (
        <div className="print-report mt-6 space-y-6">
          <div><h2 className="text-2xl font-bold tracking-tight text-fg">{report.title}</h2><p className="text-sm text-muted">{report.range} · generated {formatDate(report.generatedAt)}</p></div>
          <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{report.summary.map(([label, value]) => <Card key={label}><dt className="text-sm text-muted">{label}</dt><dd className="mt-1.5 text-xl font-bold tracking-tight text-fg">{value}</dd></Card>)}</dl>
          <Card>
            <CardHeader title="Details" subtitle={`${report.rows.length} ${report.rows.length === 1 ? 'row' : 'rows'}`} />
            <Table columns={columns} rows={report.rows} rowKey={(row) => row.join('|')} emptyTitle="No data for this range" emptyDescription="Try a wider date range or different filters." />
          </Card>
          <p className="text-xs text-muted">Demo data generated for this frontend demo.</p>
        </div>
      )}
    </>
  );
}
