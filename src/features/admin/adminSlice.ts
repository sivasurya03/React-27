import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { AdminAnalytics, AdminSettings, AdminStats, AnalyticsPeriod, LoadStatus } from '@/types';
import { adminDb } from '@/services/adminDb';
import { adminService } from '@/services/adminService';
import { toErrorMessage } from '@/utils/errors';

interface Resource<T> {
  data: T | null;
  status: LoadStatus;
  error: string | null;
}

interface AdminState {
  stats: Resource<AdminStats>;
  analytics: Resource<AdminAnalytics>;
  settings: AdminSettings;
}

const empty = <T>(): Resource<T> => ({ data: null, status: 'idle', error: null });
const initialState: AdminState = { stats: empty(), analytics: empty(), settings: adminDb.settings() };

type Rejectable = { rejectValue: string };

export const fetchAdminStats = createAsyncThunk<AdminStats, void, Rejectable>('admin/fetchStats', async (_, { rejectWithValue }) => {
  try {
    return await adminService.getStats();
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const fetchAdminAnalytics = createAsyncThunk<AdminAnalytics, AnalyticsPeriod, Rejectable>('admin/fetchAnalytics', async (period, { rejectWithValue }) => {
  try {
    return await adminService.getAnalytics(period);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const saveAdminSettings = createAsyncThunk<AdminSettings, AdminSettings, Rejectable>('admin/saveSettings', async (settings, { rejectWithValue }) => {
  try {
    return await adminService.saveSettings(settings);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminStats.pending, (state) => {
        state.stats.status = 'loading';
        state.stats.error = null;
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.stats = { data: action.payload, status: 'succeeded', error: null };
      })
      .addCase(fetchAdminStats.rejected, (state, action) => {
        state.stats.status = 'failed';
        state.stats.error = action.payload ?? 'Could not load platform statistics.';
      })
      .addCase(fetchAdminAnalytics.pending, (state) => {
        state.analytics.status = 'loading';
        state.analytics.error = null;
      })
      .addCase(fetchAdminAnalytics.fulfilled, (state, action) => {
        state.analytics = { data: action.payload, status: 'succeeded', error: null };
      })
      .addCase(fetchAdminAnalytics.rejected, (state, action) => {
        state.analytics.status = 'failed';
        state.analytics.error = action.payload ?? 'Analytics are unavailable right now.';
      })
      .addCase(saveAdminSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      });
  },
});

export default adminSlice.reducer;
