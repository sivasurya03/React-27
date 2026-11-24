import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Enrollment } from '@/types';
import { enrollments as seed } from '@/data/enrollments';
import { enrollmentService } from '@/services/enrollmentService';
import { toErrorMessage } from '@/utils/errors';
import { loadFromStorage, STORAGE_KEYS } from '@/utils/storage';

interface EnrollmentState {
  items: Enrollment[];
}
const stored = loadFromStorage<Enrollment[]>(STORAGE_KEYS.enrollments);
const initialState: EnrollmentState = {
  items: Array.isArray(stored) ? [...stored, ...seed.filter((s) => !stored.some((e) => e.id === s.id))] : seed,
};

export const enrollInCourse = createAsyncThunk<
  Enrollment,
  { studentId: string; courseId: string },
  { state: { enrollment: EnrollmentState }; rejectValue: string }
>('enrollment/enroll', async (input, { getState, rejectWithValue }) => {
  try {
    return await enrollmentService.enroll(input, getState().enrollment.items);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

const enrollmentSlice = createSlice({
  name: 'enrollment',
  initialState,
  reducers: {
    enroll(state, action: PayloadAction<{ studentId: string; courseId: string }>) {
      const { studentId, courseId } = action.payload;
      if (state.items.some((e) => e.studentId === studentId && e.courseId === courseId)) return;
      const now = new Date().toISOString();
      state.items.push({
        id: `e-${studentId}-${courseId}-${Date.now()}`,
        studentId,
        courseId,
        progress: 0,
        status: 'not-started',
        enrolledAt: now,
        lastAccessedAt: now,
      });
    },
    /** Aligns stored progress with completed lessons without touching "last accessed". */
    syncProgress(state, action: PayloadAction<{ id: string; progress: number }>) {
      const item = state.items.find((e) => e.id === action.payload.id);
      if (!item) return;
      item.progress = action.payload.progress;
      item.status = item.progress === 0 ? 'not-started' : item.progress === 100 ? 'completed' : 'in-progress';
    },
    setAdminStatus(state, action: PayloadAction<{ id: string; adminStatus?: 'cancelled' | 'refunded' }>) {
      const item = state.items.find((e) => e.id === action.payload.id);
      if (item) item.adminStatus = action.payload.adminStatus;
    },
    touchEnrollment(state, action: PayloadAction<{ studentId: string; courseId: string }>) {
      const item = state.items.find((e) => e.studentId === action.payload.studentId && e.courseId === action.payload.courseId);
      if (item) item.lastAccessedAt = new Date().toISOString();
    },
    setProgress(state, action: PayloadAction<{ id: string; progress: number }>) {
      const item = state.items.find((e) => e.id === action.payload.id);
      if (!item) return;
      item.progress = Math.max(0, Math.min(100, Math.round(action.payload.progress)));
      item.status = item.progress === 0 ? 'not-started' : item.progress === 100 ? 'completed' : 'in-progress';
      item.lastAccessedAt = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    builder.addCase(enrollInCourse.fulfilled, (state, action) => {
      const duplicate = state.items.some((e) => e.studentId === action.payload.studentId && e.courseId === action.payload.courseId && !e.adminStatus);
      if (!duplicate) state.items = [...state.items.filter((e) => !(e.studentId === action.payload.studentId && e.courseId === action.payload.courseId)), action.payload];
    });
  },
});

export const { enroll, setProgress, syncProgress, setAdminStatus, touchEnrollment } = enrollmentSlice.actions;
export default enrollmentSlice.reducer;
