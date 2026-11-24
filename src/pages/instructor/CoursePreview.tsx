import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, SearchX } from 'lucide-react';
import { PageSkeleton } from '@/components/common/PageSkeleton';
import { CourseStatusBadge } from '@/components/instructor/CourseStatusBadge';
import { CoursePreviewView } from '@/components/instructor/CoursePreviewView';
import { buttonStyles, Card, EmptyState, ErrorState } from '@/components/ui';
import { fetchCourses } from '@/features/courses/courseSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/selectors';

export default function CoursePreview() {
  const { id = '' } = useParams();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const { items, status, error, curricula } = useAppSelector((state) => state.courses);
  const instructors = useAppSelector((state) => state.instructors.items);
  const course = items.find((c) => c.id === id && c.instructorId === user?.id);

  if (status === 'failed') return <ErrorState message={error ?? undefined} onRetry={() => void dispatch(fetchCourses())} />;
  if (status !== 'succeeded') return <PageSkeleton />;
  if (!course) {
    return <Card><EmptyState icon={SearchX} title="Course not found" description="This course does not exist or belongs to another instructor." action={<Link to="/instructor/courses" className={buttonStyles('primary')}>Back to my courses</Link>} /></Card>;
  }
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center gap-3"><Link to="/instructor/courses" className={buttonStyles('ghost', 'sm')}><ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />My courses</Link><span className="text-sm font-medium text-fg">Instructor preview</span><CourseStatusBadge status={course.status} /></div>
        <Link to={`/instructor/courses/${course.id}/edit`} className={buttonStyles('primary', 'sm')}><Pencil className="mr-1.5 h-4 w-4" aria-hidden />Edit course</Link>
      </div>
      <CoursePreviewView course={course} chapters={curricula[course.id] ?? []} instructor={instructors.find((i) => i.id === course.instructorId)} />
    </>
  );
}
