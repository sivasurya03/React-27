import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Chapter, Course, LessonContent, LoadStatus, Review } from '@/types';
import { courseService } from '@/services/courseService';
import { toErrorMessage } from '@/utils/errors';

interface CourseState {
  items: Course[];
  status: LoadStatus;
  error: string | null;
  reviews: Review[];
  /** courseId -> chapters (authoritative copy, including instructor edits) */
  curricula: Record<string, Chapter[]>;
  /** lessonId -> instructor-authored quiz / assignment / resources */
  lessonContent: Record<string, LessonContent>;
  curriculumError: string | null;
}
const initialState: CourseState = { items: [], status: 'idle', error: null, reviews: [], curricula: {}, lessonContent: {}, curriculumError: null };

type Rejectable = { rejectValue: string };

export const fetchCourses = createAsyncThunk<Course[], void, Rejectable>('courses/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await courseService.getCourses();
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const fetchReviews = createAsyncThunk<Review[], void, Rejectable>('courses/fetchReviews', async (_, { rejectWithValue }) => {
  try {
    return await courseService.getAllReviews();
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const fetchCourseContent = createAsyncThunk<{ curricula: Record<string, Chapter[]>; lessonContent: Record<string, LessonContent> }, void, Rejectable>(
  'courses/fetchContent',
  async (_, { rejectWithValue }) => {
    try {
      return await courseService.getCourseContent();
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  },
);

export const fetchCurriculum = createAsyncThunk<{ courseId: string; chapters: Chapter[] }, string, Rejectable>(
  'courses/fetchCurriculum',
  async (courseId, { rejectWithValue }) => {
    try {
      return { courseId, chapters: await courseService.getCurriculum(courseId) };
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  },
);

export interface SaveCoursePayload {
  course: Course;
  chapters: Chapter[];
  content: Record<string, LessonContent>;
}

export const saveCourse = createAsyncThunk<SaveCoursePayload, SaveCoursePayload, Rejectable>('courses/save', async (input, { rejectWithValue }) => {
  try {
    const course = await courseService.saveCourse(input);
    return { ...input, course };
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const deleteCourse = createAsyncThunk<string, string, Rejectable>('courses/delete', async (id, { rejectWithValue }) => {
  try {
    return await courseService.deleteCourse(id);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const changeCourseStatus = createAsyncThunk<Course, { id: string; status: Course['status']; reason?: string }, Rejectable>(
  'courses/changeStatus',
  async ({ id, status, reason }, { rejectWithValue }) => {
    try {
      return await courseService.setCourseStatus(id, status, reason);
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  },
);

export const updateCourseDetails = createAsyncThunk<Course, { id: string; patch: Parameters<typeof courseService.updateCourse>[1] }, Rejectable>(
  'courses/updateDetails',
  async ({ id, patch }, { rejectWithValue }) => {
    try {
      return await courseService.updateCourse(id, patch);
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  },
);

const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Could not load courses.';
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.reviews = action.payload;
      })
      .addCase(fetchCourseContent.fulfilled, (state, action) => {
        state.curricula = { ...state.curricula, ...action.payload.curricula };
        state.lessonContent = action.payload.lessonContent;
      })
      .addCase(fetchCurriculum.pending, (state) => {
        state.curriculumError = null;
      })
      .addCase(fetchCurriculum.fulfilled, (state, action) => {
        state.curricula[action.payload.courseId] = action.payload.chapters;
      })
      .addCase(fetchCurriculum.rejected, (state, action) => {
        state.curriculumError = action.payload ?? 'Could not load the curriculum.';
      })
      .addCase(saveCourse.fulfilled, (state, action) => {
        const { course, chapters, content } = action.payload;
        state.items = state.items.some((c) => c.id === course.id) ? state.items.map((c) => (c.id === course.id ? course : c)) : [course, ...state.items];
        state.curricula[course.id] = chapters;
        const lessonIds = new Set(chapters.flatMap((c) => c.lessons.map((l) => l.id)));
        state.lessonContent = { ...Object.fromEntries(Object.entries(state.lessonContent).filter(([id]) => !lessonIds.has(id))), ...content };
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c.id !== action.payload);
        delete state.curricula[action.payload];
      })
      .addCase(updateCourseDetails.fulfilled, (state, action) => {
        state.items = state.items.map((c) => (c.id === action.payload.id ? action.payload : c));
      })
      .addCase(changeCourseStatus.fulfilled, (state, action) => {
        state.items = state.items.map((c) => (c.id === action.payload.id ? action.payload : c));
      });
  },
});

export default courseSlice.reducer;
