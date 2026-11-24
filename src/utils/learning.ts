import { curriculumByCourse } from '@/data/curriculum';
import type { Chapter, Lesson } from '@/types';

/** Curricula edited or created by instructors (synced from the store); static data is the fallback. */
let curriculumOverrides: Record<string, Chapter[]> = {};
export const setCurriculumOverrides = (next: Record<string, Chapter[]>): void => {
  curriculumOverrides = next;
};
export const chaptersFor = (courseId: string): Chapter[] => curriculumOverrides[courseId] ?? curriculumByCourse[courseId] ?? [];

export const learnPath = (courseId: string, lessonId: string): string => `/learn/${courseId}/${lessonId}`;

export const flat = (chapters: Chapter[]): Lesson[] => chapters.flatMap((chapter) => chapter.lessons);

export function courseProgress(chapters: Chapter[], completedIds: string[]): number {
  const lessons = flat(chapters);
  if (lessons.length === 0) return 0;
  return Math.round((lessons.filter((l) => completedIds.includes(l.id)).length / lessons.length) * 100);
}

export function chapterProgress(chapter: Chapter, completedIds: string[]): { done: number; total: number; percent: number } {
  const total = chapter.lessons.length;
  const done = chapter.lessons.filter((l) => completedIds.includes(l.id)).length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

const isGraded = (lesson: Lesson): boolean => lesson.type === 'quiz' || lesson.type === 'assignment';

/** Quizzes and assignments unlock once the teaching lessons before them in the same chapter are done. */
export function isLocked(chapters: Chapter[], lesson: Lesson, completedIds: string[]): boolean {
  if (!isGraded(lesson)) return false;
  const chapter = chapters.find((c) => c.id === lesson.chapterId);
  if (!chapter) return false;
  const index = chapter.lessons.findIndex((l) => l.id === lesson.id);
  return chapter.lessons.slice(0, index).some((l) => !isGraded(l) && !completedIds.includes(l.id));
}

export function neighbours(chapters: Chapter[], lessonId: string): { prev?: Lesson; next?: Lesson } {
  const lessons = flat(chapters);
  const index = lessons.findIndex((l) => l.id === lessonId);
  return { prev: index > 0 ? lessons[index - 1] : undefined, next: index >= 0 ? lessons[index + 1] : undefined };
}

/** The lesson "Continue learning" should open: last accessed if unfinished, else the first open lesson. */
export function resumeLesson(chapters: Chapter[], completedIds: string[] = [], lastId?: string): Lesson | undefined {
  const lessons = flat(chapters);
  const last = lessons.find((l) => l.id === lastId);
  if (last && !completedIds.includes(last.id) && !isLocked(chapters, last, completedIds)) return last;
  return (
    lessons.find((l) => !completedIds.includes(l.id) && !isLocked(chapters, l, completedIds)) ??
    lessons.find((l) => !completedIds.includes(l.id)) ??
    lessons[0]
  );
}

/** Static-curriculum variant for screens that do not load chapters into Redux. */
export const nextLesson = (courseId: string, completedIds: string[] = [], lastId?: string): Lesson | undefined =>
  resumeLesson(chaptersFor(courseId), completedIds, lastId);

export interface UpcomingActivity {
  id: string;
  kind: 'quiz' | 'assignment';
  title: string;
  courseTitle: string;
  courseId: string;
  lessonId: string;
  dueAt: string;
}

/** Next quiz or assignment per in-progress course, with staggered demo due dates. */
export function buildUpcoming(
  courseIds: string[],
  titles: Record<string, string>,
  completed: Record<string, string[]>,
  now: number = Date.now(),
): UpcomingActivity[] {
  const items: UpcomingActivity[] = [];
  courseIds.forEach((courseId, index) => {
    const done = completed[courseId] ?? [];
    const lesson = flat(chaptersFor(courseId)).find((l) => (l.type === 'quiz' || l.type === 'assignment') && !done.includes(l.id));
    if (!lesson || (lesson.type !== 'quiz' && lesson.type !== 'assignment')) return;
    items.push({
      id: lesson.id,
      kind: lesson.type,
      title: lesson.title,
      courseTitle: titles[courseId] ?? courseId,
      courseId,
      lessonId: lesson.id,
      dueAt: new Date(now + (index * 2 + 2) * 86_400_000).toISOString(),
    });
  });
  return items.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

export function dueLabel(iso: string, now: number = Date.now()): string {
  const days = Math.max(0, Math.ceil((new Date(iso).getTime() - now) / 86_400_000));
  return days === 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `Due in ${days} days`;
}

export const certificateId = (courseId: string, studentId: string, iso: string): string =>
  `LS-${new Date(iso).getFullYear()}-${courseId.toUpperCase()}-${studentId.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)}`;

export function countCompletedQuizzes(completed: Record<string, string[]>): number {
  return Object.entries(completed).reduce(
    (total, [courseId, ids]) => total + flat(chaptersFor(courseId)).filter((l) => l.type === 'quiz' && ids.includes(l.id)).length,
    0,
  );
}
