import { useEffect } from 'react';
import { fetchAdminStats } from '@/features/admin/adminSlice';
import { fetchCourseContent, fetchCourses, fetchReviews } from '@/features/courses/courseSlice';
import { fetchInstructors } from '@/features/instructors/instructorSlice';
import { fetchStudents } from '@/features/students/studentSlice';
import { reconcileProgress } from '@/features/learning/learningThunks';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

/** Loads reference data once at startup through the service layer. */
export function useBootstrapData(): void {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.id);
  useEffect(() => {
    void dispatch(fetchCourses());
    void dispatch(fetchCourseContent());
    void dispatch(fetchReviews());
    void dispatch(fetchStudents());
    void dispatch(fetchInstructors());
    void dispatch(fetchAdminStats());
  }, [dispatch]);

  useEffect(() => {
    if (userId) dispatch(reconcileProgress());
  }, [dispatch, userId]);
}
