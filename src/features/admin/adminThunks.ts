import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { changeCourseStatus } from '@/features/courses/courseSlice';
import { addNotification } from '@/features/notifications/notificationSlice';
import type { RootState } from '@/store';

type AppThunk<R> = ThunkAction<R, RootState, undefined, UnknownAction>;

/** Approves or rejects a course and tells the instructor and admins about it. */
export const reviewCourse =
  (courseId: string, decision: 'approve' | 'reject', reason?: string): AppThunk<Promise<boolean>> =>
  async (dispatch, getState) => {
    const course = getState().courses.items.find((c) => c.id === courseId);
    const result = await dispatch(changeCourseStatus({ id: courseId, status: decision === 'approve' ? 'published' : 'rejected', reason }));
    if (!changeCourseStatus.fulfilled.match(result) || !course) return false;
    dispatch(addNotification({
      type: 'course-update',
      audience: 'instructor',
      title: decision === 'approve' ? 'Course approved' : 'Course rejected',
      message: decision === 'approve' ? `“${course.title}” was approved and is now live.` : `“${course.title}” was rejected: ${reason ?? 'no reason given'}.`,
    }));
    dispatch(addNotification({ type: 'course-update', audience: 'admin', title: decision === 'approve' ? 'Course approved' : 'Course rejected', message: `${course.title} was ${decision === 'approve' ? 'approved' : 'rejected'}.` }));
    return true;
  };
