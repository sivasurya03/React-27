import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AppNotification, Role } from '@/types';
import { adminNotifications, instructorNotifications, notifications as seed } from '@/data/notifications';
import { register } from '@/features/auth/authSlice';
import { enrollInCourse } from '@/features/enrollment/enrollmentSlice';
import { loadFromStorage, STORAGE_KEYS } from '@/utils/storage';

const initialState: { items: AppNotification[] } = {
  items: (() => {
    const stored = loadFromStorage<AppNotification[]>(STORAGE_KEYS.notifications);
    const defaults = [...seed, ...instructorNotifications, ...adminNotifications];
    return Array.isArray(stored) ? [...stored, ...defaults.filter((d) => d.audience && !stored.some((n) => n.id === d.id))] : defaults;
  })(),
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: {
      reducer(state, action: PayloadAction<AppNotification>) {
        state.items = [action.payload, ...state.items].slice(0, 50);
      },
      prepare(input: Pick<AppNotification, 'type' | 'title' | 'message'> & { audience?: Role }) {
        return { payload: { ...input, id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, read: false, createdAt: new Date().toISOString() } };
      },
    },
    markAsRead(state, action: PayloadAction<string>) {
      const item = state.items.find((n) => n.id === action.payload);
      if (item) item.read = true;
    },
    toggleRead(state, action: PayloadAction<string>) {
      const item = state.items.find((n) => n.id === action.payload);
      if (item) item.read = !item.read;
    },
    markAllAsRead(state, action: PayloadAction<Role | undefined>) {
      const role = action.payload ?? 'student';
      state.items.forEach((n) => {
        if ((n.audience ?? 'student') === role) n.read = true;
      });
    },
  },
  extraReducers: (builder) => {
    const adminNote = (title: string, message: string, type: AppNotification['type']): AppNotification => ({
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type, title, message, read: false, createdAt: new Date().toISOString(), audience: 'admin',
    });
    builder
      .addCase(register.fulfilled, (state, action) => {
        state.items = [adminNote('New student registration', `${action.payload.user.name} joined the platform.`, 'course-update'), ...state.items].slice(0, 80);
      })
      .addCase(enrollInCourse.fulfilled, (state) => {
        state.items = [adminNote('New enrollment', 'A student enrolled in a course and a payment was recorded (demo).', 'system'), ...state.items].slice(0, 80);
      });
  },
});

export const { addNotification, markAsRead, markAllAsRead, toggleRead } = notificationSlice.actions;
export default notificationSlice.reducer;
