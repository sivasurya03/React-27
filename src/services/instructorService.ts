import type { AnalyticsPeriod, Course, EarningsData, Instructor, InstructorAnalytics, InstructorDashboardData } from '@/types';
import { instructors } from '@/data/people';
import { adminDb } from './adminDb';
import { buildAnalytics, buildEarnings, buildSeries, completionRateFor, performanceFor } from './instructorAnalytics';
import { courseDb } from './courseDb';
import { mockRequest } from './mock';

const mergedInstructors = (): Instructor[] =>
  instructors.map((i) => {
    const o = adminDb.instructors()[i.id];
    return { ...i, name: o?.name ?? i.name, email: o?.email ?? i.email, bio: o?.bio ?? i.bio, status: (o?.status as Instructor['status'] | undefined) ?? 'active' };
  });

const ownCourses = (instructorId: string): Course[] => courseDb.courses().filter((c) => c.instructorId === instructorId);

export const instructorService = {
  getInstructors: (): Promise<Instructor[]> => mockRequest(mergedInstructors),
  updateInstructor: (id: string, patch: { name: string; email: string; bio: string }): Promise<Instructor> =>
    mockRequest(() => {
      adminDb.patchInstructor(id, patch);
      const found = mergedInstructors().find((i) => i.id === id);
      if (!found) throw new Error('Instructor not found.');
      return found;
    }, 400),
  setInstructorStatus: (id: string, status: NonNullable<Instructor['status']>): Promise<Instructor> =>
    mockRequest(() => {
      adminDb.patchInstructor(id, { status });
      const found = mergedInstructors().find((i) => i.id === id);
      if (!found) throw new Error('Instructor not found.');
      return found;
    }, 400),

  getDashboard: (instructorId: string): Promise<InstructorDashboardData> =>
    mockRequest(() => {
      const courses = ownCourses(instructorId);
      const live = courses.filter((c) => c.studentsCount > 0);
      const enrollments = live.reduce((s, c) => s + c.studentsCount, 0);
      const rated = live.filter((c) => c.rating > 0);
      const series = buildSeries('y1', live, 11);
      return {
        kpis: {
          totalCourses: courses.length,
          published: courses.filter((c) => c.status === 'published').length,
          drafts: courses.filter((c) => c.status === 'draft').length,
          archived: courses.filter((c) => c.status === 'archived').length,
          students: Math.round(enrollments * 0.85),
          enrollments,
          rating: rated.length ? Math.round((rated.reduce((s, c) => s + c.rating, 0) / rated.length) * 10) / 10 : 0,
          revenue: series.reduce((s, p) => s + p.revenue, 0),
          completionRate: live.length ? Math.round(live.reduce((s, c) => s + completionRateFor(c) * c.studentsCount, 0) / Math.max(1, enrollments)) : 0,
        },
        enrollmentTrend: series.map((p) => ({ label: p.label, enrollments: p.enrollments })),
        revenueTrend: series.map((p) => ({ label: p.label, revenue: p.revenue })),
        performance: performanceFor(live),
      };
    }, 450),

  getAnalytics: (instructorId: string, period: AnalyticsPeriod, courseId: string): Promise<InstructorAnalytics> =>
    mockRequest(() => {
      const courses = ownCourses(instructorId).filter((c) => c.studentsCount > 0);
      if (courseId !== 'all' && !courses.some((c) => c.id === courseId)) throw new Error('No analytics are available for this course yet.');
      const chapters = courseId === 'all' ? [] : (courseDb.curricula()[courseId] ?? []).map((ch) => ch.title);
      return buildAnalytics(courses, period, courseId, chapters);
    }, 400),

  getEarnings: (instructorId: string): Promise<EarningsData> => mockRequest(() => buildEarnings(ownCourses(instructorId)), 450),
};
