import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './index';

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectMyNotifications = createSelector(
  [(state: RootState) => state.notifications.items, (state: RootState) => state.auth.user?.role ?? 'student'],
  (items, role) => items.filter((n) => (n.audience ?? 'student') === role),
);
/** Admin-controlled status of the signed-in student or instructor (undefined for admins or before data loads). */
export const selectAccountStatus = (state: RootState): string | undefined => {
  const user = state.auth.user;
  if (!user) return undefined;
  if (user.role === 'student') return state.students.items.find((s) => s.id === user.id)?.status;
  if (user.role === 'instructor') return state.instructors.items.find((i) => i.id === user.id)?.status;
  return undefined;
};
export const selectUnreadCount = createSelector([selectMyNotifications], (items): number => items.filter((n) => !n.read).length);
export const selectWishlistCount = (state: RootState): number => state.wishlist.ids.length;
export const selectIsWishlisted = (courseId: string) => (state: RootState): boolean => state.wishlist.ids.includes(courseId);

export const selectPublishedCourses = createSelector([(state: RootState) => state.courses.items], (items) =>
  items.filter((course) => course.status === 'published'),
);

export const selectReviewStats = createSelector([(state: RootState) => state.courses.reviews], (reviews) => {
  const stats: Record<string, { count: number }> = {};
  for (const review of reviews) stats[review.courseId] = { count: (stats[review.courseId]?.count ?? 0) + 1 };
  return stats;
});

export const selectInstructorNames = createSelector([(state: RootState) => state.instructors.items], (items) =>
  Object.fromEntries(items.map((i) => [i.id, i.name])) as Record<string, string>,
);

export const selectMyEnrollments = createSelector(
  [(state: RootState) => state.enrollment.items, (state: RootState) => state.auth.user?.id],
  (items, userId) => items.filter((e) => e.studentId === userId && !e.adminStatus),
);
