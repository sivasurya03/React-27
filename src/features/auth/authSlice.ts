import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthSession, LoadStatus, User } from '@/types';
import { authService } from '@/services/authService';
import { toErrorMessage } from '@/utils/errors';
import { loadFromSessionStorage, loadFromStorage, STORAGE_KEYS } from '@/utils/storage';

interface AuthState {
  user: User | null;
  token: string | null;
  /** true: session lives in localStorage; false: only for this browser tab (sessionStorage). */
  remember: boolean;
  status: LoadStatus;
  error: string | null;
}

const persisted = loadFromStorage<AuthSession>(STORAGE_KEYS.session);
const tabSession = persisted ? null : loadFromSessionStorage<AuthSession>(STORAGE_KEYS.session);
const session = persisted ?? tabSession;
const initialState: AuthState = {
  user: session?.user ?? null,
  token: session?.token ?? null,
  remember: Boolean(persisted),
  status: 'idle',
  error: null,
};

export const login = createAsyncThunk<AuthSession, { email: string; password: string; remember: boolean }, { rejectValue: string }>(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      return await authService.login(email, password);
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  },
);

export const changePassword = createAsyncThunk<{ persisted: boolean }, { current: string; next: string }, { state: { auth: { user: User | null } }; rejectValue: string }>(
  'auth/changePassword',
  async ({ current, next }, { getState, rejectWithValue }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return rejectWithValue('You need to be signed in.');
    try {
      return await authService.changePassword(userId, current, next);
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  },
);

export const register = createAsyncThunk<
  AuthSession,
  { name: string; email: string; password: string },
  { rejectValue: string }
>('auth/register', async (input, { rejectWithValue }) => {
  try {
    return await authService.register(input);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

const onPending = (state: AuthState): void => {
  state.status = 'loading';
  state.error = null;
};
const onFulfilled = (state: AuthState, action: PayloadAction<AuthSession>): void => {
  state.status = 'succeeded';
  state.user = action.payload.user;
  state.token = action.payload.token;
};
const onRejected = (state: AuthState, action: { payload?: string }): void => {
  state.status = 'failed';
  state.error = action.payload ?? 'Something went wrong. Please try again.';
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
      state.status = 'idle';
    },
    updateProfile(state, action: PayloadAction<Partial<User>>) {
      if (state.user) state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, onPending)
      .addCase(login.fulfilled, (state, action) => {
        onFulfilled(state, action);
        state.remember = action.meta.arg.remember;
      })
      .addCase(login.rejected, onRejected)
      .addCase(register.pending, onPending)
      .addCase(register.fulfilled, (state, action) => {
        onFulfilled(state, action);
        state.remember = true;
      })
      .addCase(register.rejected, onRejected);
  },
});

export const { logout, clearAuthError, updateProfile } = authSlice.actions;
export default authSlice.reducer;
