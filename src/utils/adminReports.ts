import { completionRateFor } from '@/services/instructorAnalytics';
import type { Course, Instructor, Student } from '@/types';
import type { EnrollmentRow, TransactionRow } from './adminInsights';
import { formatCurrency, formatDate, netPrice } from './format';

export type ReportType = 'students' | 'courses' | 'instructors' | 'revenue';

export interface Report {
  title: string;
  generatedAt: string;
  range: string;
  summary: [string, string][];
  headers: string[];
  rows: (string | number)[][];
}

interface Options { from: string; to: string; category: string }
interface Data { students: Student[]; instructors: Instructor[]; courses: Course[]; rows: EnrollmentRow[]; transactions: TransactionRow[] }

const within = (iso: string | undefined, from: string, to: string): boolean => {
  if (!iso) return !from && !to;
  const t = new Date(iso).getTime();
  return t >= (from ? new Date(`${from}T00:00:00`).getTime() : -Infinity) && t <= (to ? new Date(`${to}T23:59:59`).getTime() : Infinity);
};

const describeRange = (from: string, to: string): string => (from || to ? `${from ? formatDate(from) : 'Beginning'} to ${to ? formatDate(to) : 'today'}` : 'All time');

const growth = (current: number, previous: number): string => (previous === 0 ? (current > 0 ? 'New' : '0%') : `${Math.round(((current - previous) / previous) * 100)}%`);

export function buildReport(type: ReportType, options: Options, data: Data): Report {
  const { from, to, category } = options;
  const base = { generatedAt: new Date().toISOString(), range: describeRange(from, to) };

  if (type === 'students') {
    const list = data.students.filter((s) => within(s.joinedAt, from, to));
    const enrolledOf = (id: string): EnrollmentRow[] => data.rows.filter((r) => r.studentId === id && r.completion !== 'cancelled' && r.completion !== 'refunded');
    const span = from && to ? new Date(to).getTime() - new Date(from).getTime() : 0;
    const previous = span ? data.students.filter((s) => s.joinedAt && new Date(s.joinedAt).getTime() < new Date(from).getTime() && new Date(s.joinedAt).getTime() >= new Date(from).getTime() - span).length : 0;
    return {
      ...base, title: 'Student report',
      summary: [['Registrations', String(list.length)], ['Active students', String(list.filter((s) => (s.status ?? 'active') === 'active').length)], ['Completed a course', String(list.filter((s) => enrolledOf(s.id).some((r) => r.completion === 'completed')).length)], ['Growth vs previous period', span ? growth(list.length, previous) : 'Set a date range']],
      headers: ['Name', 'Email', 'Joined', 'Status', 'Enrolled', 'Completed'],
      rows: list.map((s) => [s.name, s.email, s.joinedAt ? formatDate(s.joinedAt) : '—', s.status ?? 'active', enrolledOf(s.id).length, enrolledOf(s.id).filter((r) => r.completion === 'completed').length]),
    };
  }

  if (type === 'courses') {
    const list = data.courses.filter((c) => (category === 'all' || c.category === category) && within(c.createdAt, from, to));
    const live = list.filter((c) => c.studentsCount > 0);
    const rated = list.filter((c) => c.rating > 0);
    return {
      ...base, title: 'Course report',
      summary: [['Published courses', String(list.filter((c) => c.status === 'published').length)], ['Total enrollments', String(list.reduce((s, c) => s + c.studentsCount, 0))], ['Avg. completion', live.length ? `${Math.round(live.reduce((s, c) => s + completionRateFor(c), 0) / live.length)}%` : '—'], ['Avg. rating', rated.length ? (rated.reduce((s, c) => s + c.rating, 0) / rated.length).toFixed(1) : '—']],
      headers: ['Title', 'Instructor', 'Category', 'Status', 'Students', 'Rating', 'Lessons'],
      rows: list.map((c) => [c.title, data.instructors.find((i) => i.id === c.instructorId)?.name ?? 'Unknown', c.category, c.status, c.studentsCount, c.rating || '—', c.lessonsCount]),
    };
  }

  if (type === 'instructors') {
    const list = data.instructors.filter((i) => within(i.joinedAt, from, to));
    const stats = list.map((i) => {
      const own = data.courses.filter((c) => c.instructorId === i.id);
      const revenue = own.reduce((s, c) => s + c.studentsCount * netPrice(c.price, c.discount), 0);
      const rated = own.filter((c) => c.rating > 0);
      return { i, courses: own.length, students: own.reduce((s, c) => s + c.studentsCount, 0), earnings: Math.round(revenue * 0.8), rating: rated.length ? (rated.reduce((s, c) => s + c.rating, 0) / rated.length).toFixed(1) : '—' };
    });
    return {
      ...base, title: 'Instructor report',
      summary: [['Active instructors', String(list.filter((i) => (i.status ?? 'active') === 'active').length)], ['Courses', String(stats.reduce((s, r) => s + r.courses, 0))], ['Students', String(stats.reduce((s, r) => s + r.students, 0))], ['Instructor earnings', formatCurrency(stats.reduce((s, r) => s + r.earnings, 0))]],
      headers: ['Name', 'Status', 'Courses', 'Students', 'Earnings (USD)', 'Rating'],
      rows: stats.map((r) => [r.i.name, r.i.status ?? 'active', r.courses, r.students, r.earnings, r.rating]),
    };
  }

  const list = data.transactions.filter((t) => within(t.date, from, to));
  return {
    ...base, title: 'Revenue report',
    summary: [['Gross revenue', formatCurrency(list.filter((t) => t.status === 'paid').reduce((s, t) => s + t.gross, 0))], ['Refunds', formatCurrency(list.filter((t) => t.status === 'refunded').reduce((s, t) => s + t.gross, 0))], ['Net revenue', formatCurrency(list.reduce((s, t) => s + t.net, 0))], ['Transactions', String(list.length)]],
    headers: ['Transaction', 'Date', 'Student', 'Course', 'Gross (USD)', 'Platform fee (USD)', 'Status'],
    rows: list.map((t) => [t.id, formatDate(t.date), t.student, t.courseTitle, t.gross.toFixed(2), t.fee.toFixed(2), t.status]),
  };
}
