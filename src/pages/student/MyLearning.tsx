import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle2, PlayCircle, Search } from 'lucide-react';
import { CourseGridSkeleton } from '@/components/courses/CourseGridSkeleton';
import { EnrolledCourseCard } from '@/components/courses/EnrolledCourseCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { buttonStyles, Card, EmptyState, ErrorState, Input, Select, Tabs } from '@/components/ui';
import { fetchCourses } from '@/features/courses/courseSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectInstructorNames, selectMyEnrollments } from '@/store/selectors';
import { nextLesson } from '@/utils/learning';

const EMPTY = {
  all: { icon: BookOpen, title: 'No enrollments yet', text: 'Enrol in a course to start your learning journey.' },
  'in-progress': { icon: PlayCircle, title: 'Nothing in progress', text: 'Start a course and it will show up here.' },
  completed: { icon: CheckCircle2, title: 'No completed courses yet', text: 'Finish a course to see it here and earn a certificate.' },
  'not-started': { icon: BookOpen, title: 'Everything is under way', text: 'Courses you have enrolled in but not opened will appear here.' },
} as const;

export default function MyLearning() {
  const dispatch = useAppDispatch();
  const { items, status, error } = useAppSelector((state) => state.courses);
  const enrollments = useAppSelector(selectMyEnrollments);
  const completedLessons = useAppSelector((state) => state.learning.completedLessons);
  const lastAccessed = useAppSelector((state) => state.learning.lastAccessed);
  const names = useAppSelector(selectInstructorNames);
  const [tab, setTab] = useState<keyof typeof EMPTY>('all');
  const [sort, setSort] = useState('recent');
  const [search, setSearch] = useState('');

  const courseById = useMemo(() => new Map(items.map((c) => [c.id, c])), [items]);
  const counts = useMemo(() => ({
    all: enrollments.length,
    'in-progress': enrollments.filter((e) => e.status === 'in-progress').length,
    completed: enrollments.filter((e) => e.status === 'completed').length,
    'not-started': enrollments.filter((e) => e.status === 'not-started').length,
  }), [enrollments]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enrollments
      .filter((e) => (tab === 'all' || e.status === tab) && courseById.has(e.courseId))
      .filter((e) => !q || (courseById.get(e.courseId)?.title.toLowerCase().includes(q) ?? false))
      .sort((a, b) => {
        if (sort === 'progress') return b.progress - a.progress;
        if (sort === 'title') return (courseById.get(a.courseId)?.title ?? '').localeCompare(courseById.get(b.courseId)?.title ?? '');
        if (sort === 'enrolled') return b.enrolledAt.localeCompare(a.enrolledAt);
        return b.lastAccessedAt.localeCompare(a.lastAccessedAt);
      });
  }, [enrollments, tab, search, sort, courseById]);

  if (status === 'failed') return <ErrorState message={error ?? undefined} onRetry={() => void dispatch(fetchCourses())} />;

  const empty = EMPTY[tab];
  return (
    <>
      <PageHeader title="My Learning" description="Pick up where you left off." actions={<Link to="/courses" className={buttonStyles('outline')}>Browse more courses</Link>} />
      <Tabs
        className="mb-5"
        value={tab}
        onChange={(id) => setTab(id as keyof typeof EMPTY)}
        tabs={[
          { id: 'all', label: 'All', count: counts.all },
          { id: 'in-progress', label: 'In progress', count: counts['in-progress'] },
          { id: 'completed', label: 'Completed', count: counts.completed },
          { id: 'not-started', label: 'Not started', count: counts['not-started'] },
        ]}
      />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1"><Input type="search" aria-label="Search my courses" placeholder="Search my courses" value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} /></div>
        <Select aria-label="Sort my courses" value={sort} onChange={(e) => setSort(e.target.value)} className="sm:min-w-52" options={[
          { value: 'recent', label: 'Recently accessed' },
          { value: 'progress', label: 'Highest progress' },
          { value: 'enrolled', label: 'Recently enrolled' },
          { value: 'title', label: 'Title (A to Z)' },
        ]} />
      </div>

      {status !== 'succeeded' ? (
        <CourseGridSkeleton count={3} />
      ) : rows.length === 0 ? (
        <Card><EmptyState icon={empty.icon} title={search ? 'No matching courses' : empty.title} description={search ? 'Try a different search term.' : empty.text} action={tab === 'all' || search === '' ? <Link to="/courses" className={buttonStyles('primary')}>Browse courses</Link> : undefined} /></Card>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence initial={false}>
            {rows.map((enrollment, index) => {
              const course = courseById.get(enrollment.courseId);
              if (!course) return null;
              return <EnrolledCourseCard key={enrollment.id} index={index} course={course} enrollment={enrollment} instructorName={names[course.instructorId] ?? 'LearnSphere instructor'} current={nextLesson(course.id, completedLessons[course.id], lastAccessed[course.id]?.lessonId)} />;
            })}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
