import { students } from '@/data/people';
import type { AnalyticsPeriod, Course, CoursePerformance, EarningsData, EarningsTransaction, InstructorAnalytics, SeriesPoint, TransactionStatus } from '@/types';
import { netPrice } from '@/utils/format';

/** Deterministic demo analytics, derived from course totals so every number is internally consistent. */
const hash = (text: string): number => [...text].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 100_003, 7);
const random = (seed: number) => {
  let state = seed % 2_147_483_647 || 1;
  return () => {
    state = (state * 16_807) % 2_147_483_647;
    return state / 2_147_483_647;
  };
};

/** Share of a course's lifetime enrolments per month, oldest to newest (sums to 1). */
const WEIGHTS = [0.055, 0.058, 0.06, 0.066, 0.072, 0.075, 0.08, 0.085, 0.092, 0.1, 0.11, 0.147];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const completionRateFor = (course: Course): number => 52 + (hash(course.id) % 30);
export const avgQuizScoreFor = (course: Course): number => 62 + (hash(`${course.id}q`) % 28);
const monthLabels = (now: Date): string[] => Array.from({ length: 12 }, (_, i) => MONTHS[(now.getMonth() - 11 + i + 12) % 12]);
const dayLabel = (now: Date, back: number): string => {
  const d = new Date(now.getTime() - back * 86_400_000);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

const monthlyFor = (courses: Course[]) => {
  const enrollments = WEIGHTS.map((w) => courses.reduce((sum, c) => sum + Math.round(c.studentsCount * w), 0));
  const revenue = WEIGHTS.map((w) => courses.reduce((sum, c) => sum + Math.round(c.studentsCount * w) * netPrice(c.price, c.discount), 0));
  return { enrollments, revenue: revenue.map(Math.round) };
};

export function performanceFor(courses: Course[]): CoursePerformance[] {
  return courses.map((c) => ({
    courseId: c.id,
    title: c.title,
    enrollments: c.studentsCount,
    completionRate: completionRateFor(c),
    rating: c.rating,
    revenue: Math.round(c.studentsCount * netPrice(c.price, c.discount)),
    avgQuizScore: avgQuizScoreFor(c),
    activeStudents: Math.round(c.studentsCount * 0.11),
  }));
}

export function buildSeries(period: AnalyticsPeriod, courses: Course[], seed: number, now: Date = new Date()): SeriesPoint[] {
  const { enrollments, revenue } = monthlyFor(courses);
  const rand = random(seed);
  const ratings = courses.filter((c) => c.rating > 0);
  const baseRating = ratings.length ? ratings.reduce((s, c) => s + c.rating, 0) / ratings.length : 0;
  const rating = (): number => (baseRating === 0 ? 0 : Math.round(Math.min(5, Math.max(3.8, baseRating + (rand() - 0.5) * 0.24)) * 10) / 10);
  const price = (e: number, month: number): number => (enrollments[month] === 0 ? 0 : Math.round((revenue[month] / enrollments[month]) * e));

  let before = 0;
  const point = (label: string, e: number, month: number): SeriesPoint => {
    before += e;
    return { label, enrollments: e, revenue: price(e, month), students: before, rating: rating() };
  };

  if (period === 'y1') {
    const labels = monthLabels(now);
    return enrollments.map((e, i) => point(labels[i], e, i));
  }
  if (period === 'd90') {
    before = enrollments.slice(0, 9).reduce((s, v) => s + v, 0);
    return Array.from({ length: 13 }, (_, i) => {
      const month = 9 + Math.min(2, Math.floor(i / 4.4));
      return point(dayLabel(now, (12 - i) * 7), Math.round((enrollments[month] / 4.35) * (0.85 + 0.3 * rand())), month);
    });
  }
  const days = period === 'd30' ? 30 : 7;
  before = enrollments.slice(0, 11).reduce((s, v) => s + v, 0);
  return Array.from({ length: days }, (_, i) => point(dayLabel(now, days - 1 - i), Math.round((enrollments[11] / 30) * (0.8 + 0.4 * rand())), 11));
}

export function buildAnalytics(courses: Course[], period: AnalyticsPeriod, courseId: string, chapterTitles: string[]): InstructorAnalytics {
  const selected = courseId === 'all' ? courses : courses.filter((c) => c.id === courseId);
  const points = buildSeries(period, selected, hash(`${period}${courseId}`));
  const performance = performanceFor(selected);
  const totalEnrollments = points.reduce((s, p) => s + p.enrollments, 0);
  const lifetime = selected.reduce((s, c) => s + c.studentsCount, 0) || 1;
  const weighted = (pick: (p: CoursePerformance) => number): number => Math.round(performance.reduce((s, p) => s + pick(p) * p.enrollments, 0) / lifetime) || 0;
  const rated = selected.filter((c) => c.rating > 0);
  const engagement =
    courseId !== 'all' && chapterTitles.length > 0
      ? chapterTitles.map((label, i) => ({ label, value: Math.max(8, Math.min(100, completionRateFor(selected[0]) + 24 - i * 13 + (hash(label) % 7))) }))
      : performance.map((p) => ({ label: p.title.split(/[:&-]/)[0].trim().slice(0, 22), value: p.completionRate }));
  return {
    period,
    courseId,
    points,
    totals: {
      enrollments: totalEnrollments,
      revenue: points.reduce((s, p) => s + p.revenue, 0),
      activeStudents: Math.round(totalEnrollments * 0.62),
      completionRate: weighted((p) => p.completionRate),
      avgQuizScore: weighted((p) => p.avgQuizScore),
      avgRating: rated.length ? Math.round((rated.reduce((s, c) => s + c.rating, 0) / rated.length) * 10) / 10 : 0,
    },
    performance,
    engagement,
  };
}

const FEE_RATE = 0.2;

export function buildEarnings(courses: Course[], now: Date = new Date()): EarningsData {
  const selling = courses.filter((c) => c.studentsCount > 0);
  const { revenue } = monthlyFor(selling);
  const labels = monthLabels(now);
  const monthly = revenue.map((r, i) => ({ month: labels[i], revenue: Math.round(r * (1 - FEE_RATE)) }));

  const rand = random(hash(selling.map((c) => c.id).join('')));
  const transactions: EarningsTransaction[] = selling.length === 0 ? [] : Array.from({ length: 64 }, (_, i) => {
    const course = selling[Math.floor(rand() * selling.length)];
    const amount = netPrice(course.price, course.discount);
    const status: TransactionStatus = i < 4 ? 'pending' : i % 13 === 7 ? 'refunded' : 'completed';
    const fee = Math.round(amount * FEE_RATE * 100) / 100;
    return {
      id: `tx-${1000 + i}`,
      date: new Date(now.getTime() - (i * 4.6 + rand() * 2) * 86_400_000).toISOString(),
      student: students[(i * 7 + hash(course.id)) % students.length].name,
      courseId: course.id,
      courseTitle: course.title,
      amount,
      fee,
      net: status === 'refunded' ? 0 : Math.round((amount - fee) * 100) / 100,
      status,
    };
  });

  const total = monthly.reduce((s, m) => s + m.revenue, 0);
  const pending = Math.round(transactions.filter((t) => t.status === 'pending').reduce((s, t) => s + t.net, 0));
  return {
    summary: { total, thisMonth: monthly[11].revenue, lastMonth: monthly[10].revenue, pending, withdrawable: Math.max(0, total - pending - Math.round(monthly[11].revenue * 0.4)) },
    monthly,
    transactions,
  };
}
