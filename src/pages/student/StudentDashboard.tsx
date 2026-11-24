import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, BookOpen, CheckCircle2, ClipboardCheck, Clock, Flame, HelpCircle, PlayCircle, TrendingUp, Trophy, type LucideIcon } from 'lucide-react';
import { BarTrendChart } from '@/components/charts/TrendCharts';
import { CourseThumbnail } from '@/components/common/CourseThumbnail';
import { StatCard } from '@/components/common/StatCard';
import { CourseCard } from '@/components/courses/CourseCard';
import { CourseGridSkeleton } from '@/components/courses/CourseGridSkeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, buttonStyles, Card, CardHeader, EmptyState, ErrorState, ProgressBar, Skeleton } from '@/components/ui';
import { weeklyActivity } from '@/data/analytics';
import { fetchCourses } from '@/features/courses/courseSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser, selectInstructorNames, selectMyEnrollments, selectPublishedCourses, selectReviewStats } from '@/store/selectors';
import { cn } from '@/utils/cn';
import { buildUpcoming, countCompletedQuizzes, dueLabel, learnPath, nextLesson } from '@/utils/learning';
import { slideUp, staggerChildren } from '@/utils/motion';

const MESSAGES = ['Small steps every day add up to big skills.', 'Consistency beats intensity. Keep your streak alive!', 'Your next lesson is only a click away.'];

function Achievement({ icon: Icon, title, value, note, unlocked }: { icon: LucideIcon; title: string; value: string; note: string; unlocked: boolean }) {
  return (
    <motion.li variants={slideUp} className="flex items-center gap-3 rounded-xl border border-line p-4">
      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', unlocked ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-subtle text-muted')}><Icon className="h-5 w-5" aria-hidden /></span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-fg">{title}</p>
        <p className="truncate text-xs text-muted">{value} · {note}</p>
      </div>
    </motion.li>
  );
}

export default function StudentDashboard() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const { status, error, items } = useAppSelector((state) => state.courses);
  const published = useAppSelector(selectPublishedCourses);
  const enrollments = useAppSelector(selectMyEnrollments);
  const students = useAppSelector((state) => state.students.items);
  const completedLessons = useAppSelector((state) => state.learning.completedLessons);
  const lastAccessed = useAppSelector((state) => state.learning.lastAccessed);
  const certificates = useAppSelector((state) => state.learning.certificates);
  const names = useAppSelector(selectInstructorNames);
  const reviewStats = useAppSelector(selectReviewStats);

  const courseById = useMemo(() => new Map(items.map((c) => [c.id, c])), [items]);
  const profile = students.find((s) => s.id === user?.id);
  const inProgress = useMemo(() => enrollments.filter((e) => e.status === 'in-progress'), [enrollments]);
  const completedCount = enrollments.filter((e) => e.status === 'completed').length;
  const current = useMemo(() => [...inProgress].sort((a, b) => b.lastAccessedAt.localeCompare(a.lastAccessedAt))[0], [inProgress]);
  const currentCourse = current ? courseById.get(current.courseId) : undefined;
  const resume = currentCourse ? nextLesson(currentCourse.id, completedLessons[currentCourse.id], lastAccessed[currentCourse.id]?.lessonId) : undefined;
  const recommended = useMemo(() => published.filter((c) => !enrollments.some((e) => e.courseId === c.id)).sort((a, b) => b.rating - a.rating).slice(0, 6), [published, enrollments]);
  const titles = useMemo(() => Object.fromEntries(items.map((c) => [c.id, c.title])) as Record<string, string>, [items]);
  const upcoming = useMemo(() => buildUpcoming(inProgress.map((e) => e.courseId), titles, completedLessons), [inProgress, titles, completedLessons]);
  const quizzes = countCompletedQuizzes(completedLessons);
  const overall = enrollments.length ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length) : 0;
  const myCertificates = certificates.filter((c) => c.studentId === user?.id).length;
  const nextQuiz = upcoming.find((a) => a.kind === 'quiz');
  const nextAssignment = upcoming.find((a) => a.kind === 'assignment');
  const streak = profile?.streak ?? 0;
  const message = MESSAGES[new Date().getDate() % MESSAGES.length];
  const loading = status !== 'succeeded';

  if (status === 'failed') return <ErrorState message={error ?? undefined} onRetry={() => void dispatch(fetchCourses())} />;

  return (
    <>
      <PageHeader title={`Welcome back, ${user?.name.split(' ')[0] ?? 'learner'}`} description={message} />

      <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Enrolled courses" value={String(enrollments.length)} icon={BookOpen} />
        <StatCard label="In progress" value={String(inProgress.length)} icon={PlayCircle} />
        <StatCard label="Completed" value={String(completedCount)} icon={CheckCircle2} />
        <StatCard label="Learning progress" value={`${overall}%`} icon={TrendingUp} hint="Across all courses" />
        <StatCard label="Learning hours" value={String(profile?.learningHours ?? 0)} icon={Clock} />
        <StatCard label="Current streak" value={`${streak} days`} icon={Flame} />
        <StatCard label="Certificates" value={String(myCertificates)} icon={Award} />
        <StatCard label="Upcoming" value={`${nextQuiz ? 1 : 0} quiz · ${nextAssignment ? 1 : 0} task`} icon={ClipboardCheck} hint={nextQuiz?.courseTitle ?? nextAssignment?.courseTitle ?? 'Nothing due'} />
      </motion.div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Continue learning" subtitle="Your most recently accessed course" />
          {loading ? (
            <Skeleton className="h-36" />
          ) : currentCourse && current ? (
            <div className="flex flex-col gap-4 sm:flex-row">
              <CourseThumbnail src={currentCourse.thumbnail} alt={`${currentCourse.title} thumbnail`} className="aspect-video w-full rounded-xl sm:w-60" />
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div>
                  <Badge variant="brand">{currentCourse.category}</Badge>
                  <h3 className="mt-2 text-lg font-semibold leading-snug text-fg">{currentCourse.title}</h3>
                  <p className="text-sm text-muted">{names[currentCourse.instructorId]}</p>
                </div>
                {resume && <p className="text-sm text-fg"><span className="text-muted">Up next: </span>{resume.title}</p>}
                <ProgressBar value={current.progress} showLabel label={`${currentCourse.title} progress`} />
                <Link to={resume ? learnPath(currentCourse.id, resume.id) : '/my-learning'} className={buttonStyles('primary', 'md')}><PlayCircle className="mr-2 h-4 w-4" aria-hidden />Continue Learning</Link>
              </div>
            </div>
          ) : (
            <EmptyState icon={BookOpen} title="Nothing in progress" description="Enrol in a course to start learning." action={<Link to="/courses" className={buttonStyles('primary')}>Browse Courses</Link>} />
          )}
        </Card>

        <Card>
          <CardHeader title="Weekly activity" subtitle="Hours learned this week" />
          <BarTrendChart data={weeklyActivity} xKey="day" yKey="hours" height={210} label="Hours learned each day this week" format={(v) => `${v}h`} />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Upcoming activities" subtitle="Quizzes and assignments waiting for you" />
          {loading ? <Skeleton className="h-28" /> : upcoming.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="You are all caught up" description="New quizzes and assignments will show up here." />
          ) : (
            <ul className="divide-y divide-line">
              {upcoming.slice(0, 4).map((a) => (
                <li key={a.id}>
                  <Link to={learnPath(a.courseId, a.lessonId)} className="flex items-center gap-3 py-3 transition hover:text-brand-text">
                    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', a.kind === 'quiz' ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300')}>
                      {a.kind === 'quiz' ? <HelpCircle className="h-5 w-5" aria-hidden /> : <ClipboardCheck className="h-5 w-5" aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-fg">{a.title}</span><span className="block truncate text-xs text-muted">{a.courseTitle}</span></span>
                    <Badge variant={a.kind === 'quiz' ? 'info' : 'warning'}>{dueLabel(a.dueAt)}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Achievements" subtitle="Milestones from your learning" />
          <motion.ul variants={staggerChildren} initial="hidden" animate="visible" className="grid gap-3 sm:grid-cols-2">
            <Achievement icon={Flame} title="Learning streak" value={`${streak} days`} note={streak >= 7 ? 'On fire' : 'Keep going'} unlocked={streak >= 7} />
            <Achievement icon={Trophy} title="Course completion" value={`${completedCount} completed`} note={completedCount > 0 ? 'Well done' : 'Finish one'} unlocked={completedCount > 0} />
            <Achievement icon={Award} title="Certificates" value={`${myCertificates} earned`} note={myCertificates > 0 ? 'View them' : 'Complete a course'} unlocked={myCertificates > 0} />
            <Achievement icon={HelpCircle} title="Quiz achiever" value={`${quizzes} quizzes passed`} note={quizzes > 0 ? 'Sharp mind' : 'Take a quiz'} unlocked={quizzes > 0} />
          </motion.ul>
        </Card>
      </div>

      <section className="mt-8" aria-labelledby="recommended-heading">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 id="recommended-heading" className="text-xl font-semibold text-fg">Recommended for you</h2>
          <Link to="/courses" className="text-sm font-medium text-brand-text hover:underline">View all courses</Link>
        </div>
        {loading ? <CourseGridSkeleton count={3} /> : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {recommended.map((c, i) => <CourseCard key={c.id} course={c} index={i} instructorName={names[c.instructorId] ?? 'LearnSphere instructor'} reviewCount={reviewStats[c.id]?.count ?? 0} />)}
          </div>
        )}
      </section>
    </>
  );
}
