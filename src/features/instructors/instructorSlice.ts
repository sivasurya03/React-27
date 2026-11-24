import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { AnalyticsPeriod, EarningsData, Instructor, InstructorAnalytics, InstructorDashboardData, LoadStatus } from '@/types';
import { instructorService } from '@/services/instructorService';
import { toErrorMessage } from '@/utils/errors';

interface Resource<T> {
  data: T | null;
  status: LoadStatus;
  error: string | null;
}

interface InstructorState {
  items: Instructor[];
  status: LoadStatus;
  error: string | null;
  dashboard: Resource<InstructorDashboardData>;
  analytics: Resource<InstructorAnalytics>;
  earnings: Resource<EarningsData>;
}

const empty = <T>(): Resource<T> => ({ data: null, status: 'idle', error: null });
const initialState: InstructorState = { items: [], status: 'idle', error: null, dashboard: empty(), analytics: empty(), earnings: empty() };

type Rejectable = { rejectValue: string };

export const fetchInstructors = createAsyncThunk<Instructor[], void, Rejectable>('instructors/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await instructorService.getInstructors();
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const updateInstructor = createAsyncThunk<Instructor, { id: string; name: string; email: string; bio: string }, Rejectable>('instructors/update', async ({ id, ...patch }, { rejectWithValue }) => {
  try {
    return await instructorService.updateInstructor(id, patch);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const setInstructorStatus = createAsyncThunk<Instructor, { id: string; status: NonNullable<Instructor['status']> }, Rejectable>('instructors/setStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    return await instructorService.setInstructorStatus(id, status);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const fetchInstructorDashboard = createAsyncThunk<InstructorDashboardData, string, Rejectable>('instructors/dashboard', async (id, { rejectWithValue }) => {
  try {
    return await instructorService.getDashboard(id);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const fetchInstructorAnalytics = createAsyncThunk<InstructorAnalytics, { instructorId: string; period: AnalyticsPeriod; courseId: string }, Rejectable>(
  'instructors/analytics',
  async ({ instructorId, period, courseId }, { rejectWithValue }) => {
    try {
      return await instructorService.getAnalytics(instructorId, period, courseId);
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  },
);

export const fetchInstructorEarnings = createAsyncThunk<EarningsData, string, Rejectable>('instructors/earnings', async (id, { rejectWithValue }) => {
  try {
    return await instructorService.getEarnings(id);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

const instructorSlice = createSlice({
  name: 'instructors',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInstructors.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchInstructors.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchInstructors.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Could not load instructors.';
      })
      .addCase(updateInstructor.fulfilled, (state, action) => {
        state.items = state.items.map((i) => (i.id === action.payload.id ? action.payload : i));
      })
      .addCase(setInstructorStatus.fulfilled, (state, action) => {
        state.items = state.items.map((i) => (i.id === action.payload.id ? action.payload : i));
      })
      .addCase(fetchInstructorDashboard.pending, (state) => {
        state.dashboard.status = 'loading';
        state.dashboard.error = null;
      })
      .addCase(fetchInstructorDashboard.fulfilled, (state, action) => {
        state.dashboard = { data: action.payload, status: 'succeeded', error: null };
      })
      .addCase(fetchInstructorDashboard.rejected, (state, action) => {
        state.dashboard.status = 'failed';
        state.dashboard.error = action.payload ?? 'Could not load the dashboard.';
      })
      .addCase(fetchInstructorAnalytics.pending, (state) => {
        state.analytics.status = 'loading';
        state.analytics.error = null;
      })
      .addCase(fetchInstructorAnalytics.fulfilled, (state, action) => {
        state.analytics = { data: action.payload, status: 'succeeded', error: null };
      })
      .addCase(fetchInstructorAnalytics.rejected, (state, action) => {
        state.analytics.status = 'failed';
        state.analytics.error = action.payload ?? 'Analytics are unavailable right now.';
      })
      .addCase(fetchInstructorEarnings.pending, (state) => {
        state.earnings.status = 'loading';
        state.earnings.error = null;
      })
      .addCase(fetchInstructorEarnings.fulfilled, (state, action) => {
        state.earnings = { data: action.payload, status: 'succeeded', error: null };
      })
      .addCase(fetchInstructorEarnings.rejected, (state, action) => {
        state.earnings.status = 'failed';
        state.earnings.error = action.payload ?? 'Could not load earnings.';
      });
  },
});

export default instructorSlice.reducer;
