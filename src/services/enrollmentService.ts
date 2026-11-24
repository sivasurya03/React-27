import type { Enrollment } from '@/types';
import { enrollments } from '@/data/enrollments';
import { mockRequest } from './mock';

export const enrollmentService = {
  getEnrollments: (): Promise<Enrollment[]> => mockRequest(() => enrollments),
  /** Simulated enrolment/payment; rejects duplicates so the UI can never double-enrol. */
  enroll: (input: { studentId: string; courseId: string }, existing: Enrollment[]): Promise<Enrollment> =>
    mockRequest(() => {
      if (existing.some((e) => e.studentId === input.studentId && e.courseId === input.courseId && !e.adminStatus)) {
        throw new Error('You are already enrolled in this course.');
      }
      const now = new Date().toISOString();
      return { id: `e-${input.studentId}-${input.courseId}-${Date.now()}`, ...input, progress: 0, status: 'not-started' as const, enrolledAt: now, lastAccessedAt: now };
    }, 700),
  getForStudent: (studentId: string): Promise<Enrollment[]> =>
    mockRequest(() => enrollments.filter((e) => e.studentId === studentId)),
};
