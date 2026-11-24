import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { LearnSkeleton } from '@/components/learning/LearnSkeleton';
import { fetchCurriculum } from '@/features/courses/courseSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { learnPath, resumeLesson } from '@/utils/learning';

export default function LearnRedirect() {
  const { courseId = '' } = useParams();
  const course = useAppSelector((state) => state.courses.items.find((c) => c.id === courseId));
  const chapters = useAppSelector((state) => state.courses.curricula[courseId]);
  const completed = useAppSelector((state) => state.learning.completedLessons[courseId]);
  const last = useAppSelector((state) => state.learning.lastAccessed[courseId]?.lessonId);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (course && !chapters) void dispatch(fetchCurriculum(course.id));
  }, [course, chapters, dispatch]);

  const target = chapters ? resumeLesson(chapters, completed, last) : undefined;
  if (target) return <Navigate to={learnPath(courseId, target.id)} replace />;
  return <LearnSkeleton />;
}
