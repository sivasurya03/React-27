import { useCallback, useEffect, useMemo } from 'react';
import { fetchAdminStats } from '@/features/admin/adminSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { buildEnrollmentRows, buildTransactions, withLiveActivity } from '@/utils/adminInsights';

/** Platform totals plus live activity from the shared store (enrolments, registrations, refunds). */
export function useAdminOverview() {
  const dispatch = useAppDispatch();
  const { data, status, error } = useAppSelector((state) => state.admin.stats);
  const courses = useAppSelector((state) => state.courses.items);
  const students = useAppSelector((state) => state.students.items);
  const instructors = useAppSelector((state) => state.instructors.items);
  const enrollments = useAppSelector((state) => state.enrollment.items);

  useEffect(() => {
    void dispatch(fetchAdminStats());
  }, [dispatch, courses]);

  const rows = useMemo(() => buildEnrollmentRows(enrollments, courses, students, instructors), [enrollments, courses, students, instructors]);
  const transactions = useMemo(() => buildTransactions(rows), [rows]);
  const stats = useMemo(() => (data ? withLiveActivity(data, rows, students) : null), [data, rows, students]);
  const retry = useCallback(() => void dispatch(fetchAdminStats()), [dispatch]);

  return { stats, rows, transactions, status, error, retry };
}
