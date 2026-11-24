import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { AccountStatus, LoadStatus, Student } from '@/types';
import { studentService } from '@/services/studentService';
import { toErrorMessage } from '@/utils/errors';

interface StudentState {
  items: Student[];
  status: LoadStatus;
  error: string | null;
}
const initialState: StudentState = { items: [], status: 'idle', error: null };

type Rejectable = { rejectValue: string };

export const fetchStudents = createAsyncThunk<Student[], void, Rejectable>('students/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await studentService.getStudents();
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const updateStudent = createAsyncThunk<Student, { id: string; name: string; email: string }, Rejectable>('students/update', async ({ id, ...patch }, { rejectWithValue }) => {
  try {
    return await studentService.updateStudent(id, patch);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const setStudentStatus = createAsyncThunk<Student, { id: string; status: AccountStatus }, Rejectable>('students/setStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    return await studentService.setStatus(id, status);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

const studentSlice = createSlice({
  name: 'students',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    const replace = (state: StudentState, student: Student): void => {
      state.items = state.items.map((s) => (s.id === student.id ? student : s));
    };
    builder
      .addCase(fetchStudents.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Could not load students.';
      })
      .addCase(updateStudent.fulfilled, (state, action) => replace(state, action.payload))
      .addCase(setStudentStatus.fulfilled, (state, action) => replace(state, action.payload));
  },
});

export default studentSlice.reducer;
