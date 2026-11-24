import { courses as seedCourses } from '@/data/courses';
import { curriculumByCourse } from '@/data/curriculum';
import type { Chapter, Course, LessonContent } from '@/types';
import { loadFromStorage, saveToStorage } from '@/utils/storage';

/** Mock backend database for catalogue data, persisted to localStorage. Replace with real API calls later. */
interface CourseDb {
  courses: Course[];
  curricula: Record<string, Chapter[]>;
  lessonContent: Record<string, LessonContent>;
}

const KEY = 'lms:course-db';
let cache: CourseDb | null = null;

const seed = (): CourseDb => ({
  courses: seedCourses.map((c) => ({ ...c, updatedAt: c.createdAt })),
  curricula: { ...curriculumByCourse },
  lessonContent: {},
});

const isValid = (value: unknown): value is CourseDb => {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<CourseDb>;
  return Array.isArray(v.courses) && typeof v.curricula === 'object' && v.curricula !== null && typeof v.lessonContent === 'object' && v.lessonContent !== null;
};

function db(): CourseDb {
  if (!cache) {
    const stored = loadFromStorage<unknown>(KEY);
    cache = isValid(stored) ? stored : seed();
    const base = seed();
    const known = new Set(cache.courses.map((c) => c.id));
    const missing = base.courses.filter((c) => !known.has(c.id));
    if (missing.length > 0) {
      cache.courses = [...cache.courses, ...missing];
      cache.curricula = { ...Object.fromEntries(missing.map((c) => [c.id, base.curricula[c.id]])), ...cache.curricula };
    }
  }
  return cache;
}

const persist = (): void => saveToStorage(KEY, db());

export const courseDb = {
  courses: (): Course[] => db().courses,
  curricula: (): Record<string, Chapter[]> => db().curricula,
  lessonContent: (): Record<string, LessonContent> => db().lessonContent,

  save(course: Course, chapters: Chapter[], content: Record<string, LessonContent>): Course {
    const store = db();
    const saved = { ...course, updatedAt: new Date().toISOString() };
    const exists = store.courses.some((c) => c.id === course.id);
    store.courses = exists ? store.courses.map((c) => (c.id === course.id ? saved : c)) : [saved, ...store.courses];
    store.curricula = { ...store.curricula, [course.id]: chapters };
    const lessonIds = new Set(chapters.flatMap((c) => c.lessons.map((l) => l.id)));
    const kept = Object.fromEntries(Object.entries(store.lessonContent).filter(([id]) => !lessonIds.has(id)));
    store.lessonContent = { ...kept, ...content };
    persist();
    return saved;
  },

  /** Updates catalogue fields only; curriculum and lesson content are left untouched. */
  patch(course: Course): Course {
    const store = db();
    const saved = { ...course, updatedAt: new Date().toISOString() };
    store.courses = store.courses.map((c) => (c.id === course.id ? saved : c));
    persist();
    return saved;
  },

  remove(id: string): void {
    const store = db();
    store.courses = store.courses.filter((c) => c.id !== id);
    store.curricula = Object.fromEntries(Object.entries(store.curricula).filter(([key]) => key !== id));
    persist();
  },

  setStatus(id: string, status: Course['status'], reason?: string): Course {
    const store = db();
    const current = store.courses.find((c) => c.id === id);
    if (!current) throw new Error('Course not found.');
    const next = { ...current, status, rejectionReason: status === 'rejected' ? reason : undefined, updatedAt: new Date().toISOString() };
    store.courses = store.courses.map((c) => (c.id === id ? next : c));
    persist();
    return next;
  },
};
