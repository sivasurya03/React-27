import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { curriculumByCourse } from '@/data/curriculum';
import { addNotification } from '@/features/notifications/notificationSlice';
import { setProgress, syncProgress } from '@/features/enrollment/enrollmentSlice';
import type { RootState } from '@/store';
import type { Chapter, QuizQuestion } from '@/types';
import { certificateId, courseProgress, flat } from '@/utils/learning';
import { issueCertificate, saveAssignment, saveQuizResult, setLessonCompleted, type AssignmentSubmission, type QuizResult } from './learningSlice';

type AppThunk<R> = ThunkAction<R, RootState, undefined, UnknownAction>;

export interface CompletionResult {
  progress: number;
  courseCompleted: boolean;
}

const chaptersOf = (state: RootState, courseId: string): Chapter[] => state.courses.curricula[courseId] ?? curriculumByCourse[courseId] ?? [];

/** Marks a lesson (in)complete and keeps enrolment progress, notifications and certificates in sync. */
export const setLessonComplete =
  (courseId: string, lessonId: string, completed: boolean): AppThunk<CompletionResult> =>
  (dispatch, getState) => {
    dispatch(setLessonCompleted({ courseId, lessonId, completed }));
    const state = getState();
    const user = state.auth.user;
    const chapters = chaptersOf(state, courseId);
    const progress = courseProgress(chapters, state.learning.completedLessons[courseId] ?? []);
    const enrollment = state.enrollment.items.find((e) => e.studentId === user?.id && e.courseId === courseId);
    if (enrollment) dispatch(setProgress({ id: enrollment.id, progress }));

    const course = state.courses.items.find((c) => c.id === courseId);
    const lesson = flat(chapters).find((l) => l.id === lessonId);
    if (!completed || !course || !lesson || !user) return { progress, courseCompleted: false };

    dispatch(addNotification({ type: 'course-update', title: 'Lesson completed', message: `You completed “${lesson.title}” in ${course.title}.` }));
    if (progress < 100) return { progress, courseCompleted: false };

    const issued = state.learning.certificates.some((c) => c.studentId === user.id && c.courseId === courseId);
    if (!issued) {
      const completedAt = new Date().toISOString();
      dispatch(issueCertificate({
        id: certificateId(courseId, user.id, completedAt),
        courseId,
        studentId: user.id,
        studentName: user.name,
        courseTitle: course.title,
        instructorName: state.instructors.items.find((i) => i.id === course.instructorId)?.name ?? 'LearnSphere instructor',
        completedAt,
        durationHours: course.duration,
      }));
      dispatch(addNotification({ type: 'course-update', title: 'Course completed', message: `Congratulations! You completed ${course.title}.` }));
      dispatch(addNotification({ type: 'certificate', title: 'Certificate available', message: `Your certificate for ${course.title} is ready to view.` }));
    }
    return { progress, courseCompleted: true };
  };

export const submitQuiz =
  (courseId: string, lessonId: string, lessonTitle: string, questions: QuizQuestion[], answers: (number | null)[], passMark: number): AppThunk<{ result: QuizResult; completion?: CompletionResult }> =>
  (dispatch) => {
    const score = questions.filter((q, i) => answers[i] === q.correctIndex).length;
    const percentage = Math.round((score / questions.length) * 100);
    const result: QuizResult = { score, total: questions.length, percentage, passed: percentage >= passMark, takenAt: new Date().toISOString(), answers };
    dispatch(saveQuizResult({ quizId: lessonId, result }));
    dispatch(addNotification({ type: 'quiz', title: 'Quiz completed', message: `${lessonTitle}: you scored ${score}/${questions.length} (${percentage}%) — ${result.passed ? 'passed' : 'not passed yet, try again'}.` }));
    return { result, completion: result.passed ? dispatch(setLessonComplete(courseId, lessonId, true)) : undefined };
  };

export const submitAssignment =
  (courseId: string, lessonId: string, lessonTitle: string, draft: Pick<AssignmentSubmission, 'text' | 'fileName' | 'fileSize'>): AppThunk<CompletionResult> =>
  (dispatch) => {
    const now = new Date().toISOString();
    dispatch(saveAssignment({ lessonId, submission: { ...draft, status: 'submitted', updatedAt: now, submittedAt: now } }));
    dispatch(addNotification({ type: 'assignment', title: 'Assignment submitted', message: `Your work for “${lessonTitle}” was submitted.` }));
    return dispatch(setLessonComplete(courseId, lessonId, true));
  };

/** Aligns stored enrolment progress with the lessons actually completed. */
export const reconcileProgress = (): AppThunk<void> => (dispatch, getState) => {
  const state = getState();
  const userId = state.auth.user?.id;
  for (const enrollment of state.enrollment.items.filter((e) => e.studentId === userId)) {
    const progress = courseProgress(chaptersOf(state, enrollment.courseId), state.learning.completedLessons[enrollment.courseId] ?? []);
    if (progress !== enrollment.progress) dispatch(syncProgress({ id: enrollment.id, progress }));
  }
};
