import { enrollments as seedEnrollments } from '@/data/enrollments';
import { students as seedStudents } from '@/data/people';
import type { AdminStats, Course, Enrollment, Instructor, Student } from '@/types';
import { netPrice } from './format';

export type CompletionState = 'active' | 'completed' | 'cancelled' | 'refunded';
export type PaymentState = 'paid' | 'pending' | 'refunded' | 'failed';

export const PLATFORM_FEE = 0.2;

export interface EnrollmentRow {
  id: string;
  enrollment: Enrollment;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  instructorId: string;
  instructorName: string;
  enrolledAt: string;
  progress: number;
  completion: CompletionState;
  payment: PaymentState;
  amount: number;
}

/** One row per enrolment, joining students, courses and instructors (the single source for admin tables). */
export function buildEnrollmentRows(enrollments: Enrollment[], courses: Course[], students: Student[], instructors: Instructor[], now: number = Date.now()): EnrollmentRow[] {
  return enrollments.flatMap((enrollment) => {
    const course = courses.find((c) => c.id === enrollment.courseId);
    const student = students.find((s) => s.id === enrollment.studentId);
    if (!course || !student) return [];
    const completion: CompletionState = enrollment.adminStatus ?? (enrollment.status === 'completed' ? 'completed' : 'active');
    const payment: PaymentState = enrollment.adminStatus === 'refunded' ? 'refunded' : enrollment.adminStatus === 'cancelled' ? 'failed' : now - new Date(enrollment.enrolledAt).getTime() < 2 * 86_400_000 ? 'pending' : 'paid';
    return [{
      id: enrollment.id, enrollment, studentId: student.id, studentName: student.name, courseId: course.id, courseTitle: course.title,
      instructorId: course.instructorId, instructorName: instructors.find((i) => i.id === course.instructorId)?.name ?? 'Unknown',
      enrolledAt: enrollment.enrolledAt, progress: enrollment.progress, completion, payment, amount: netPrice(course.price, course.discount),
    }];
  });
}

export interface TransactionRow {
  id: string;
  date: string;
  student: string;
  courseTitle: string;
  instructorName: string;
  gross: number;
  fee: number;
  instructorEarnings: number;
  net: number;
  status: PaymentState;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

export const buildTransactions = (rows: EnrollmentRow[]): TransactionRow[] =>
  rows.map((r) => ({
    id: `TX-${r.id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 14)}`,
    date: r.enrolledAt,
    student: r.studentName,
    courseTitle: r.courseTitle,
    instructorName: r.instructorName,
    gross: r.amount,
    fee: round2(r.amount * PLATFORM_FEE),
    instructorEarnings: round2(r.amount * (1 - PLATFORM_FEE)),
    net: r.payment === 'paid' ? round2(r.amount * PLATFORM_FEE) : 0,
    status: r.payment,
  }));

const seedIds = new Set(seedEnrollments.map((e) => e.id));
const seedStudentIds = new Set(seedStudents.map((s) => s.id));
const seedCompleted = seedEnrollments.filter((e) => e.progress === 100).length;

/** Applies live activity (new registrations, enrolments, refunds, completions) on top of the platform-scale totals. */
export function withLiveActivity(stats: AdminStats, rows: EnrollmentRow[], students: Student[]): AdminStats {
  const fresh = rows.filter((r) => !seedIds.has(r.id));
  const newRevenue = fresh.filter((r) => r.payment === 'paid' || r.payment === 'pending').reduce((s, r) => s + r.amount, 0);
  const refunded = rows.filter((r) => r.payment === 'refunded').reduce((s, r) => s + r.amount, 0);
  const completed = rows.filter((r) => r.completion === 'completed').length;
  return {
    ...stats,
    totals: {
      ...stats.totals,
      students: stats.totals.students + students.filter((s) => !seedStudentIds.has(s.id)).length,
      enrollments: stats.totals.enrollments + fresh.length,
      revenue: Math.round(stats.totals.revenue + newRevenue),
      monthlyRevenue: Math.round(stats.totals.monthlyRevenue + newRevenue),
      refunds: Math.round(stats.totals.refunds + refunded),
      completed: Math.max(0, stats.totals.completed + completed - seedCompleted),
    },
  };
}

export const paymentLabel = (s: PaymentState): string => ({ paid: 'Paid', pending: 'Pending', refunded: 'Refunded', failed: 'Failed' })[s];
export const completionLabel = (s: CompletionState): string => ({ active: 'Active', completed: 'Completed', cancelled: 'Cancelled', refunded: 'Refunded' })[s];
