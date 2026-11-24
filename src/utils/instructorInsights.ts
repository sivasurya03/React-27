import type { Course, Enrollment } from '@/types';
import { chaptersFor, flat } from './learning';

export type AssignmentState = 'Not started' | 'In progress' | 'Submitted' | 'Reviewed';

export interface StudentCourseDetail {
  completedLessons: number;
  totalLessons: number;
  quizScore: number | null;
  assignment: AssignmentState;
}

const hash = (text: string): number => [...text].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 100_003, 7);

interface LearningLike {
  completedLessons: Record<string, string[]>;
  quizResults: Record<string, { percentage: number }>;
  assignments: Record<string, { status: string }>;
}

/**
 * Per-student detail for the instructor view. The demo student has real tracked learning data;
 * for everyone else the numbers are derived deterministically from enrolment progress (demo data).
 */
export function studentCourseDetail(enrollment: Enrollment, course: Course, learning: LearningLike, realStudentId: string): StudentCourseDetail {
  const lessons = flat(chaptersFor(course.id));
  const total = lessons.length;
  if (enrollment.studentId === realStudentId) {
    const done = learning.completedLessons[course.id] ?? [];
    const quizzes = lessons.filter((l) => l.type === 'quiz').map((l) => learning.quizResults[l.id]).filter(Boolean);
    const assignment = lessons.find((l) => l.type === 'assignment');
    const submission = assignment ? learning.assignments[assignment.id] : undefined;
    return {
      completedLessons: done.filter((id) => lessons.some((l) => l.id === id)).length,
      totalLessons: total,
      quizScore: quizzes.length ? Math.round(quizzes.reduce((s, q) => s + q.percentage, 0) / quizzes.length) : null,
      assignment: submission ? (submission.status === 'reviewed' ? 'Reviewed' : submission.status === 'submitted' ? 'Submitted' : 'In progress') : 'Not started',
    };
  }
  const seed = hash(`${enrollment.studentId}${course.id}`);
  const p = enrollment.progress;
  return {
    completedLessons: Math.floor((p / 100) * total),
    totalLessons: total,
    quizScore: p >= 35 ? 58 + (seed % 38) : null,
    assignment: p >= 80 ? 'Reviewed' : p >= 60 ? 'Submitted' : p >= 30 ? 'In progress' : 'Not started',
  };
}

export const isActiveRecently = (iso: string, now: number = Date.now()): boolean => now - new Date(iso).getTime() < 14 * 86_400_000;
