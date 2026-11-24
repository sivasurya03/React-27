import type { Chapter, Course, LessonContent, Review } from '@/types';
import { reviews } from '@/data/reviews';
import { courseDb } from './courseDb';
import { mockRequest } from './mock';

export const courseService = {
  getCourses: (): Promise<Course[]> => mockRequest(() => [...courseDb.courses()]),
  getCourseById: (id: string): Promise<Course> =>
    mockRequest(() => {
      const course = courseDb.courses().find((c) => c.id === id);
      if (!course) throw new Error('Course not found.');
      return course;
    }),
  getCurriculum: (courseId: string): Promise<Chapter[]> => mockRequest(() => courseDb.curricula()[courseId] ?? []),
  /** All curricula and instructor-authored lesson content in one call. */
  getCourseContent: (): Promise<{ curricula: Record<string, Chapter[]>; lessonContent: Record<string, LessonContent> }> =>
    mockRequest(() => ({ curricula: { ...courseDb.curricula() }, lessonContent: { ...courseDb.lessonContent() } }), 150),
  getAllReviews: (): Promise<Review[]> => mockRequest(() => reviews),
  getReviews: (courseId: string): Promise<Review[]> => mockRequest(() => reviews.filter((r) => r.courseId === courseId)),

  saveCourse: (input: { course: Course; chapters: Chapter[]; content: Record<string, LessonContent> }): Promise<Course> =>
    mockRequest(() => courseDb.save(input.course, input.chapters, input.content), 600),
  deleteCourse: (id: string): Promise<string> =>
    mockRequest(() => {
      courseDb.remove(id);
      return id;
    }, 400),
  setCourseStatus: (id: string, status: Course['status'], reason?: string): Promise<Course> => mockRequest(() => courseDb.setStatus(id, status, reason), 400),
  /** Admin edit of catalogue fields; keeps curriculum and student counts untouched. */
  updateCourse: (id: string, patch: Partial<Pick<Course, 'title' | 'category' | 'level' | 'price' | 'discount'>>): Promise<Course> =>
    mockRequest(() => {
      const current = courseDb.courses().find((c) => c.id === id);
      if (!current) throw new Error('Course not found.');
      return courseDb.patch({ ...current, ...patch });
    }, 450),
};
