import { COURSE_CATEGORIES, type AdminAnalytics, type AdminSettings, type AdminStats, type AnalyticsPeriod, type Course } from '@/types';
import { instructors } from '@/data/people';
import { netPrice } from '@/utils/format';
import { adminDb } from './adminDb';
import { buildSeries, performanceFor } from './instructorAnalytics';
import { courseDb } from './courseDb';
import { mockRequest } from './mock';

const REFUND_RATE = 0.03;
const pct = (current: number, previous: number): number => (previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 1000) / 10);
const sellable = (courses: Course[]): Course[] => courses.filter((c) => c.studentsCount > 0);

const createdBetween = (courses: Course[], fromDays: number, toDays: number): number =>
  courses.filter((c) => {
    const age = (Date.now() - new Date(c.createdAt).getTime()) / 86_400_000;
    return age >= fromDays && age < toDays;
  }).length;

export const adminService = {
  /** Platform totals are derived from the course database so they react to approvals, deletions and new courses. */
  getStats: (): Promise<AdminStats> =>
    mockRequest(() => {
      const courses = courseDb.courses();
      const live = sellable(courses);
      const points = buildSeries('y1', live, 7);
      const last = points[points.length - 1];
      const prev = points[points.length - 2];
      const enrollments = live.reduce((s, c) => s + c.studentsCount, 0);
      const revenue = Math.round(live.reduce((s, c) => s + c.studentsCount * netPrice(c.price, c.discount), 0));
      const students = Math.round(enrollments * 0.64);
      const published = courses.filter((c) => c.status === 'published').length;
      return {
        totals: {
          students, instructors: instructors.length, courses: courses.length, activeCourses: published, enrollments,
          completed: Math.round(enrollments * 0.34), revenue, monthlyRevenue: last.revenue, refunds: Math.round(revenue * REFUND_RATE),
        },
        changes: {
          students: pct(Math.round(last.students * 0.64), Math.round(prev.students * 0.64)),
          instructors: 0,
          courses: pct(createdBetween(courses, 0, 30), createdBetween(courses, 30, 60)),
          activeCourses: 0,
          enrollments: pct(last.enrollments, prev.enrollments),
          completed: pct(last.enrollments, prev.enrollments),
          revenue: pct(last.revenue, prev.revenue),
          monthlyRevenue: pct(last.revenue, prev.revenue),
        },
        revenueSeries: points.map((p) => ({ month: p.label, revenue: p.revenue, net: Math.round(p.revenue * (1 - REFUND_RATE)) })),
        enrollmentSeries: points.map((p) => ({ month: p.label, enrollments: p.enrollments })),
        studentSeries: points.map((p) => ({ month: p.label, students: Math.round(p.students * 0.64) })),
      };
    }, 450),

  getAnalytics: (period: AnalyticsPeriod): Promise<AdminAnalytics> =>
    mockRequest(() => {
      const courses = courseDb.courses();
      const live = sellable(courses);
      return {
        period,
        points: buildSeries(period, live, 31 + period.length),
        category: COURSE_CATEGORIES.map((category) => {
          const inCategory = courses.filter((c) => c.category === category);
          return {
            category,
            courses: inCategory.length,
            enrollments: inCategory.reduce((s, c) => s + c.studentsCount, 0),
            revenue: Math.round(inCategory.reduce((s, c) => s + c.studentsCount * netPrice(c.price, c.discount), 0)),
          };
        }),
        courses: performanceFor(live).sort((a, b) => b.enrollments - a.enrollments),
        instructors: instructors.map((i) => {
          const own = live.filter((c) => c.instructorId === i.id);
          const rated = own.filter((c) => c.rating > 0);
          return {
            id: i.id, name: i.name, courses: courses.filter((c) => c.instructorId === i.id).length,
            students: own.reduce((s, c) => s + c.studentsCount, 0),
            revenue: Math.round(own.reduce((s, c) => s + c.studentsCount * netPrice(c.price, c.discount), 0)),
            rating: rated.length ? Math.round((rated.reduce((s, c) => s + c.rating, 0) / rated.length) * 10) / 10 : 0,
          };
        }).sort((a, b) => b.revenue - a.revenue),
      };
    }, 400),

  getSettings: (): Promise<AdminSettings> => mockRequest(() => adminDb.settings(), 100),
  saveSettings: (settings: AdminSettings): Promise<AdminSettings> => mockRequest(() => adminDb.saveSettings(settings), 500),
};
