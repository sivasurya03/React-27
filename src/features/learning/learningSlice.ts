import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { courses } from '@/data/courses';
import { enrollments } from '@/data/enrollments';
import { flattenLessons } from '@/data/curriculum';
import { demoAccounts, instructors } from '@/data/people';
import { daysAgo } from '@/data/time';
import type { CertificateRecord } from '@/types';
import { certificateId } from '@/utils/learning';
import { loadFromStorage, STORAGE_KEYS } from '@/utils/storage';

export interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  takenAt: string;
  /** chosen option per question (null = unanswered) */
  answers: (number | null)[];
}

export type AssignmentStatus = 'in-progress' | 'submitted' | 'reviewed';

export interface AssignmentSubmission {
  status: AssignmentStatus;
  text: string;
  fileName?: string;
  fileSize?: number;
  updatedAt: string;
  submittedAt?: string;
  score?: number;
  feedback?: string;
}

interface LearningState {
  /** courseId -> completed lesson ids */
  completedLessons: Record<string, string[]>;
  /** quiz lesson id -> latest attempt */
  quizResults: Record<string, QuizResult>;
  /** assignment lesson id -> submission */
  assignments: Record<string, AssignmentSubmission>;
  /** lesson id -> personal notes */
  notes: Record<string, string>;
  /** courseId -> last opened lesson */
  lastAccessed: Record<string, { lessonId: string; at: string }>;
  certificates: CertificateRecord[];
}

const DEMO_STUDENT = demoAccounts[0];

/** Demo progress for the demo student, derived from seeded enrolment percentages. */
function seedState(): LearningState {
  const state: LearningState = { completedLessons: {}, quizResults: {}, assignments: {}, notes: {}, lastAccessed: {}, certificates: [] };
  for (const enrollment of enrollments.filter((e) => e.studentId === DEMO_STUDENT.id)) {
    const lessons = flattenLessons(enrollment.courseId);
    const done = lessons.slice(0, Math.floor((enrollment.progress / 100) * lessons.length));
    state.completedLessons[enrollment.courseId] = done.map((l) => l.id);
    for (const lesson of done) {
      if (lesson.type === 'quiz') {
        state.quizResults[lesson.id] = { score: 3, total: 4, percentage: 75, passed: true, takenAt: daysAgo(12), answers: [] };
      }
      if (lesson.type === 'assignment') {
        state.assignments[lesson.id] = { status: 'reviewed', text: 'Submitted in an earlier session.', updatedAt: daysAgo(10), submittedAt: daysAgo(10), score: 90, feedback: 'Clear approach and well structured. Nice work.' };
      }
    }
    const course = courses.find((c) => c.id === enrollment.courseId);
    if (course && enrollment.progress === 100) {
      state.certificates.push({
        id: certificateId(course.id, DEMO_STUDENT.id, enrollment.lastAccessedAt),
        courseId: course.id,
        studentId: DEMO_STUDENT.id,
        studentName: DEMO_STUDENT.name,
        courseTitle: course.title,
        instructorName: instructors.find((i) => i.id === course.instructorId)?.name ?? 'LearnSphere instructor',
        completedAt: enrollment.lastAccessedAt,
        durationHours: course.duration,
      });
    }
  }
  return state;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

/** Rebuilds state from storage defensively: malformed or old-format data falls back to the seed. */
function restore(): LearningState {
  const seed = seedState();
  const raw = loadFromStorage<unknown>(STORAGE_KEYS.learning);
  if (!isRecord(raw)) return seed;
  const completed = isRecord(raw.completedLessons)
    ? Object.fromEntries(
        Object.entries(raw.completedLessons)
          .filter(([, ids]) => Array.isArray(ids))
          .map(([courseId, ids]) => [courseId, (ids as unknown[]).filter((id): id is string => typeof id === 'string')]),
      )
    : seed.completedLessons;
  const certs = Array.isArray(raw.certificates) ? (raw.certificates as CertificateRecord[]).filter((c) => isRecord(c) && typeof c.id === 'string') : [];
  return {
    completedLessons: completed,
    quizResults: { ...seed.quizResults, ...(isRecord(raw.quizResults) ? (raw.quizResults as Record<string, QuizResult>) : {}) },
    assignments: { ...seed.assignments, ...(isRecord(raw.assignments) ? (raw.assignments as Record<string, AssignmentSubmission>) : {}) },
    notes: isRecord(raw.notes) ? (raw.notes as Record<string, string>) : {},
    lastAccessed: isRecord(raw.lastAccessed) ? (raw.lastAccessed as LearningState['lastAccessed']) : {},
    certificates: [...seed.certificates.filter((s) => !certs.some((c) => c.id === s.id)), ...certs],
  };
}

const learningSlice = createSlice({
  name: 'learning',
  initialState: restore(),
  reducers: {
    toggleLessonComplete(state, action: PayloadAction<{ courseId: string; lessonId: string }>) {
      const { courseId, lessonId } = action.payload;
      const done = state.completedLessons[courseId] ?? [];
      state.completedLessons[courseId] = done.includes(lessonId) ? done.filter((id) => id !== lessonId) : [...done, lessonId];
    },
    setLessonCompleted(state, action: PayloadAction<{ courseId: string; lessonId: string; completed: boolean }>) {
      const { courseId, lessonId, completed } = action.payload;
      const done = (state.completedLessons[courseId] ?? []).filter((id) => id !== lessonId);
      state.completedLessons[courseId] = completed ? [...done, lessonId] : done;
    },
    setLastAccessed(state, action: PayloadAction<{ courseId: string; lessonId: string }>) {
      const { courseId, lessonId } = action.payload;
      const current = state.lastAccessed[courseId];
      if (current?.lessonId === lessonId) return;
      state.lastAccessed[courseId] = { lessonId, at: new Date().toISOString() };
    },
    saveNotes(state, action: PayloadAction<{ lessonId: string; text: string }>) {
      state.notes[action.payload.lessonId] = action.payload.text;
    },
    saveQuizResult(state, action: PayloadAction<{ quizId: string; result: QuizResult }>) {
      state.quizResults[action.payload.quizId] = action.payload.result;
    },
    saveAssignment(state, action: PayloadAction<{ lessonId: string; submission: AssignmentSubmission }>) {
      state.assignments[action.payload.lessonId] = action.payload.submission;
    },
    issueCertificate(state, action: PayloadAction<CertificateRecord>) {
      if (!state.certificates.some((c) => c.studentId === action.payload.studentId && c.courseId === action.payload.courseId)) {
        state.certificates.push(action.payload);
      }
    },
  },
});

export const { toggleLessonComplete, setLessonCompleted, setLastAccessed, saveNotes, saveQuizResult, saveAssignment, issueCertificate } = learningSlice.actions;
export default learningSlice.reducer;
