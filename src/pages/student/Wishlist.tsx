import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { CourseCard } from '@/components/courses/CourseCard';
import { CourseGridSkeleton } from '@/components/courses/CourseGridSkeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { buttonStyles, Card, EmptyState, ErrorState, useToast } from '@/components/ui';
import { fetchCourses } from '@/features/courses/courseSlice';
import { toggleWishlist } from '@/features/wishlist/wishlistSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectInstructorNames, selectReviewStats } from '@/store/selectors';

export default function Wishlist() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { items, status, error } = useAppSelector((state) => state.courses);
  const ids = useAppSelector((state) => state.wishlist.ids);
  const names = useAppSelector(selectInstructorNames);
  const reviewStats = useAppSelector(selectReviewStats);
  const saved = items.filter((course) => ids.includes(course.id) && course.status === 'published');

  if (status === 'failed') return <ErrorState message={error ?? undefined} onRetry={() => void dispatch(fetchCourses())} />;

  return (
    <>
      <PageHeader title="Wishlist" description={ids.length ? `${ids.length} saved ${ids.length === 1 ? 'course' : 'courses'}` : 'Save courses to revisit them later.'} />
      {status !== 'succeeded' ? (
        <CourseGridSkeleton count={3} />
      ) : saved.length === 0 ? (
        <Card><EmptyState icon={Heart} title="Your wishlist is empty" description="Tap the heart on any course to save it here." action={<Link to="/courses" className={buttonStyles('primary')}>Browse courses</Link>} /></Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {saved.map((course, index) => (
              <CourseCard
                key={course.id}
                course={course}
                index={index}
                instructorName={names[course.instructorId] ?? 'LearnSphere instructor'}
                reviewCount={reviewStats[course.id]?.count ?? 0}
                onRemove={() => { dispatch(toggleWishlist(course.id)); toast.info('Removed from wishlist', course.title); }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
