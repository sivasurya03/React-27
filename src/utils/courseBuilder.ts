import type { Chapter, Course, CourseCategory, CourseLevel, Lesson, LessonContent, LessonType } from '@/types';
import { makeThumbnail } from './thumbnail';
import type { FieldErrors } from './validators';

export interface CourseDraft {
  title: string;
  subtitle: string;
  description: string;
  category: CourseCategory | '';
  level: CourseLevel | '';
  language: string;
  tags: string;
  outcomes: string[];
  requirements: string[];
  pricing: 'paid' | 'free';
  price: string;
  discountPrice: string;
  subscription: boolean;
  thumbnail: string;
  chapters: Chapter[];
  content: Record<string, LessonContent>;
}

export const LESSON_TYPES: { value: LessonType; label: string }[] = [
  { value: 'video', label: 'Video' },
  { value: 'article', label: 'Article' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'resource', label: 'Resource' },
];

const uid = (): string => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
export const newCourseId = (): string => `c-${uid()}`;

export const emptyDraft = (): CourseDraft => ({
  title: '', subtitle: '', description: '', category: '', level: '', language: 'English', tags: '',
  outcomes: [''], requirements: [''], pricing: 'paid', price: '', discountPrice: '', subscription: false,
  thumbnail: '', chapters: [], content: {},
});

export const newChapter = (courseId: string, title = 'New chapter'): Chapter => ({ id: `ch-${uid()}`, courseId, title, lessons: [] });

export const newLesson = (courseId: string, chapterId: string, type: LessonType, title = 'New lesson'): Lesson => ({
  id: `l-${uid()}`, courseId, chapterId, title, type, duration: type === 'quiz' || type === 'assignment' ? 15 : 10, isCompleted: false, isPreview: false,
});

export const lessonCount = (chapters: Chapter[]): number => chapters.reduce((sum, c) => sum + c.lessons.length, 0);
export const durationHours = (chapters: Chapter[]): number =>
  Math.round((chapters.reduce((sum, c) => sum + c.lessons.reduce((m, l) => m + l.duration, 0), 0) / 60) * 10) / 10;

export function draftFromCourse(course: Course, chapters: Chapter[], lessonContent: Record<string, LessonContent>): CourseDraft {
  const ids = new Set(chapters.flatMap((c) => c.lessons.map((l) => l.id)));
  const discounted = course.price * (1 - course.discount / 100);
  return {
    title: course.title,
    subtitle: course.subtitle ?? '',
    description: course.description,
    category: course.category,
    level: course.level,
    language: course.language,
    tags: course.tags.join(', '),
    outcomes: course.outcomes?.length ? course.outcomes : [''],
    requirements: course.requirements?.length ? course.requirements : [''],
    pricing: course.price === 0 ? 'free' : 'paid',
    price: course.price === 0 ? '' : String(course.price),
    discountPrice: course.discount > 0 ? String(Math.round(discounted * 100) / 100) : '',
    subscription: Boolean(course.subscription),
    thumbnail: course.thumbnail.startsWith('data:image/jpeg') ? course.thumbnail : '',
    chapters: chapters.map((c) => ({ ...c, lessons: c.lessons.map((l) => ({ ...l })) })),
    content: Object.fromEntries(Object.entries(lessonContent).filter(([id]) => ids.has(id))),
  };
}

const clean = (lines: string[]): string[] => lines.map((l) => l.trim()).filter(Boolean);

/** Builds the stored course. Fields the editor does not own (rating, students, createdAt…) come from `existing`. */
export function buildCourse(draft: CourseDraft, courseId: string, instructorId: string, status: Course['status'], existing?: Course): Course {
  const price = draft.pricing === 'free' ? 0 : Number(draft.price) || 0;
  const discountPrice = Number(draft.discountPrice) || 0;
  const category = (draft.category || 'Web Development') as CourseCategory;
  return {
    id: courseId,
    title: draft.title.trim(),
    subtitle: draft.subtitle.trim() || undefined,
    description: draft.description.trim(),
    thumbnail: draft.thumbnail || makeThumbnail(category, courseId),
    category,
    level: (draft.level || 'All Levels') as CourseLevel,
    language: draft.language.trim() || 'English',
    price,
    discount: price > 0 && discountPrice > 0 && discountPrice < price ? Math.round((1 - discountPrice / price) * 100) : 0,
    rating: existing?.rating ?? 0,
    studentsCount: existing?.studentsCount ?? 0,
    duration: durationHours(draft.chapters),
    lessonsCount: lessonCount(draft.chapters),
    instructorId,
    status,
    tags: draft.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 8),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    outcomes: clean(draft.outcomes),
    requirements: clean(draft.requirements),
    subscription: draft.subscription,
    rejectionReason: status === 'rejected' ? existing?.rejectionReason : undefined,
    featured: existing?.featured,
  };
}

export type BasicErrors = FieldErrors<'title' | 'description' | 'category' | 'level' | 'language'>;
export function validateBasics(d: CourseDraft): BasicErrors {
  const errors: BasicErrors = {};
  if (d.title.trim().length < 5) errors.title = 'Enter a title of at least 5 characters.';
  else if (d.title.trim().length > 80) errors.title = 'Keep the title under 80 characters.';
  if (d.description.trim().length < 40) errors.description = 'Describe the course in at least 40 characters.';
  if (!d.category) errors.category = 'Choose a category.';
  if (!d.level) errors.level = 'Choose a level.';
  if (!d.language.trim()) errors.language = 'Enter the course language.';
  return errors;
}

export type PricingErrors = FieldErrors<'price' | 'discountPrice'>;
export function validatePricing(d: CourseDraft): PricingErrors {
  const errors: PricingErrors = {};
  if (d.pricing === 'free') return errors;
  const price = Number(d.price);
  if (!d.price.trim() || Number.isNaN(price) || price < 1 || price > 999) errors.price = 'Enter a price between $1 and $999.';
  if (d.discountPrice.trim()) {
    const discount = Number(d.discountPrice);
    if (Number.isNaN(discount) || discount < 0) errors.discountPrice = 'Enter a valid discount price.';
    else if (!errors.price && discount >= price) errors.discountPrice = 'The discount price must be lower than the price.';
  }
  return errors;
}

export function validateQuiz(questions: LessonContent['quiz']): string | undefined {
  if (!questions || questions.length === 0) return 'Add at least one question.';
  for (const [i, q] of questions.entries()) {
    if (!q.prompt.trim()) return `Question ${i + 1} needs text.`;
    if (q.options.filter((o) => o.trim()).length < 2) return `Question ${i + 1} needs at least two answer options.`;
    if (!q.options[q.correctIndex]?.trim()) return `Choose a correct answer for question ${i + 1}.`;
  }
  return undefined;
}

export function validateAssignment(assignment: LessonContent['assignment']): string | undefined {
  if (!assignment || clean(assignment.instructions).length === 0) return 'Add instructions for the assignment.';
  if (!(assignment.maxScore > 0)) return 'Max score must be greater than zero.';
  if (!(assignment.dueDays >= 1)) return 'Due date must be at least 1 day after enrolment.';
  return undefined;
}

export function validateCurriculum(d: CourseDraft): string | undefined {
  if (d.chapters.length === 0) return 'Add at least one chapter.';
  if (d.chapters.some((c) => !c.title.trim())) return 'Every chapter needs a title.';
  if (lessonCount(d.chapters) === 0) return 'Add at least one lesson.';
  for (const lesson of d.chapters.flatMap((c) => c.lessons)) {
    if (!lesson.title.trim()) return 'Every lesson needs a title.';
    if (lesson.type === 'quiz') {
      const problem = validateQuiz(d.content[lesson.id]?.quiz);
      if (problem) return `Quiz “${lesson.title}”: ${problem}`;
    }
    if (lesson.type === 'assignment') {
      const problem = validateAssignment(d.content[lesson.id]?.assignment);
      if (problem) return `Assignment “${lesson.title}”: ${problem}`;
    }
  }
  return undefined;
}

/** Returns the first step (0-based) that blocks publishing, or null when the course is complete. */
export function firstPublishBlocker(d: CourseDraft): { step: number; message: string } | null {
  const basics = Object.values(validateBasics(d))[0];
  if (basics) return { step: 0, message: basics };
  const pricing = Object.values(validatePricing(d))[0];
  if (pricing) return { step: 1, message: pricing };
  const curriculum = validateCurriculum(d);
  if (curriculum) return { step: 3, message: curriculum };
  return null;
}

/** Copies a course with fresh ids so the duplicate never shares lessons or content with the original. */
export function duplicateCourse(course: Course, chapters: Chapter[], lessonContent: Record<string, LessonContent>, instructorId: string) {
  const id = newCourseId();
  const content: Record<string, LessonContent> = {};
  const copied = chapters.map((chapter) => {
    const chapterId = `ch-${uid()}`;
    return {
      ...chapter,
      id: chapterId,
      courseId: id,
      lessons: chapter.lessons.map((lesson) => {
        const lessonId = `l-${uid()}`;
        if (lessonContent[lesson.id]) content[lessonId] = lessonContent[lesson.id];
        return { ...lesson, id: lessonId, chapterId, courseId: id, isCompleted: false };
      }),
    };
  });
  const now = new Date().toISOString();
  const copy: Course = { ...course, id, title: `${course.title} (Copy)`, status: 'draft', rating: 0, studentsCount: 0, instructorId, createdAt: now, updatedAt: now, featured: false };
  return { course: copy, chapters: copied, content };
}
