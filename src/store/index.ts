import { configureStore } from '@reduxjs/toolkit';
import adminReducer from '@/features/admin/adminSlice';
import authReducer from '@/features/auth/authSlice';
import courseReducer from '@/features/courses/courseSlice';
import enrollmentReducer from '@/features/enrollment/enrollmentSlice';
import instructorReducer from '@/features/instructors/instructorSlice';
import learningReducer from '@/features/learning/learningSlice';
import notificationReducer from '@/features/notifications/notificationSlice';
import studentReducer from '@/features/students/studentSlice';
import themeReducer from '@/features/theme/themeSlice';
import wishlistReducer from '@/features/wishlist/wishlistSlice';
import { setLessonContentOverrides } from '@/data/learningContent';
import type { User } from '@/types';
import { setCurriculumOverrides } from '@/utils/learning';
import {
  loadFromStorage,
  removeFromSessionStorage,
  removeFromStorage,
  saveToSessionStorage,
  saveToStorage,
  STORAGE_KEYS,
} from '@/utils/storage';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    courses: courseReducer,
    enrollment: enrollmentReducer,
    learning: learningReducer,
    wishlist: wishlistReducer,
    notifications: notificationReducer,
    students: studentReducer,
    instructors: instructorReducer,
    admin: adminReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

type AuthState = ReturnType<typeof store.getState>['auth'];

function persistSession(auth: AuthState, before: AuthState): void {
  const { user, token, remember } = auth;
  if (!user || !token) {
    removeFromStorage(STORAGE_KEYS.session);
    removeFromSessionStorage(STORAGE_KEYS.session);
    return;
  }
  if (user === before.user && token === before.token && remember === before.remember) return;
  if (remember) {
    saveToStorage(STORAGE_KEYS.session, { user, token });
    removeFromSessionStorage(STORAGE_KEYS.session);
  } else {
    saveToSessionStorage(STORAGE_KEYS.session, { user, token });
    removeFromStorage(STORAGE_KEYS.session);
  }
  // Keep profile edits across sign-outs (the mock backend has no database).
  const profiles = loadFromStorage<Record<string, User>>(STORAGE_KEYS.profiles) ?? {};
  saveToStorage(STORAGE_KEYS.profiles, { ...profiles, [user.id]: user });
}

/** Persist only the slices that changed (reference comparison keeps this cheap). */
let previous = store.getState();
store.subscribe(() => {
  const state = store.getState();
  if (state.theme !== previous.theme) saveToStorage(STORAGE_KEYS.theme, state.theme.mode);
  if (state.auth !== previous.auth) persistSession(state.auth, previous.auth);
  if (state.courses.curricula !== previous.courses.curricula) setCurriculumOverrides(state.courses.curricula);
  if (state.courses.lessonContent !== previous.courses.lessonContent) setLessonContentOverrides(state.courses.lessonContent);
  if (state.wishlist !== previous.wishlist) saveToStorage(STORAGE_KEYS.wishlist, state.wishlist.ids);
  if (state.enrollment !== previous.enrollment) saveToStorage(STORAGE_KEYS.enrollments, state.enrollment.items);
  if (state.learning !== previous.learning) saveToStorage(STORAGE_KEYS.learning, state.learning);
  if (state.notifications !== previous.notifications) saveToStorage(STORAGE_KEYS.notifications, state.notifications.items);
  previous = state;
});
