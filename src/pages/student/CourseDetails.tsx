import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Award, CheckCircle2, Clock, Globe, Layers, SearchX, Smartphone, Users } from 'lucide-react';
import { CourseThumbnail } from '@/components/common/CourseThumbnail';
import { CourseCard } from '@/components/courses/CourseCard';
import { CurriculumAccordion } from '@/components/courses/CurriculumAccordion';
import { EnrollModal } from '@/components/courses/EnrollModal';
import { InstructorCard } from '@/components/courses/InstructorCard';
import { PriceTag } from '@/components/courses/PriceTag';
import { Rating } from '@/components/courses/Rating';
import { ReviewsSection } from '@/components/courses/ReviewsSection';
import { WishlistButton } from '@/components/courses/WishlistButton';
import { Badge, AccordionItem, Button, buttonStyles, Card, CardHeader, EmptyState, ErrorState, ProgressBar, Skeleton, useToast } from '@/components/ui';
import { courseContent, FAQS } from '@/data/courseContent';
import { fetchCourses, fetchCurriculum } from '@/features/courses/courseSlice';
import { enrollInCourse } from '@/features/enrollment/enrollmentSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser, selectInstructorNames, selectPublishedCourses, selectReviewStats } from '@/store/selectors';
import { formatCompact, formatDate } from '@/utils/format';
import { courseProgress, learnPath, nextLesson } from '@/utils/learning';
import { slideUp } from '@/utils/motion';

function DetailsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3" aria-busy="true" aria-label="Loading course">
      <div className="space-y-4 lg:col-span-2">
        <Skeleton className="h-6 w-32" /><Skeleton className="h-10 w-full" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-64 rounded-2xl" />
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}

export default function CourseDetails() {
  const { courseId = '' } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAppSelector(selectCurrentUser);
  const { items, status, error, reviews, curricula, curriculumError } = useAppSelector((state) => state.courses);
  const published = useAppSelector(selectPublishedCourses);
  const instructors = useAppSelector((state) => state.instructors.items);
  const students = useAppSelector((state) => state.students.items);
  const names = useAppSelector(selectInstructorNames);
  const reviewStats = useAppSelector(selectReviewStats);
  const enrollments = useAppSelector((state) => state.enrollment.items);
  const completedLessons = useAppSelector((state) => state.learning.completedLessons);
  const lastAccessed = useAppSelector((state) => state.learning.lastAccessed);

  const [modal, setModal] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const course = items.find((c) => c.id === courseId);
  const chapters = curricula[courseId];

  useEffect(() => {
    if (course && !curricula[course.id]) void dispatch(fetchCurriculum(course.id));
  }, [course, curricula, dispatch]);

  const courseReviews = useMemo(() => reviews.filter((r) => r.courseId === courseId), [reviews, courseId]);
  const average = courseReviews.length ? courseReviews.reduce((sum, r) => sum + r.rating, 0) / courseReviews.length : course?.rating ?? 0;
  const related = useMemo(() => {
    const others = published.filter((c) => c.id !== courseId);
    const same = others.filter((c) => c.category === course?.category);
    return [...same, ...others.filter((c) => !same.includes(c))].slice(0, 3);
  }, [published, courseId, course?.category]);

  if (status === 'failed') return <ErrorState message={error ?? undefined} onRetry={() => void dispatch(fetchCourses())} />;
  if (status !== 'succeeded') return <DetailsSkeleton />;
  if (!course || (course.status !== 'published' && !enrollments.some((e) => e.studentId === user?.id && e.courseId === course.id && !e.adminStatus))) {
    return (
      <Card>
        <EmptyState icon={SearchX} title="Course not found" description="This course may have been removed or the link is incorrect." action={<div className="flex gap-2"><Button variant="outline" onClick={() => navigate(-1)}>Go back</Button><Link to="/courses" className={buttonStyles('primary')}>Browse courses</Link></div>} />
      </Card>
    );
  }

  const instructor = instructors.find((i) => i.id === course.instructorId);
  const instructorName = names[course.instructorId] ?? 'LearnSphere instructor';
  const enrollment = enrollments.find((e) => e.studentId === user?.id && e.courseId === course.id && !e.adminStatus);
  const fallback = courseContent[course.id];
  const outcomes = course.outcomes?.length ? course.outcomes : fallback?.outcomes ?? [];
  const requirements = course.requirements?.length ? course.requirements : fallback?.requirements ?? [];
  const content = outcomes.length || requirements.length ? { outcomes, requirements } : undefined;
  const completed = completedLessons[course.id] ?? [];
  const resume = nextLesson(course.id, completed, lastAccessed[course.id]?.lessonId);
  const progress = chapters ? courseProgress(chapters, completed) : enrollment?.progress ?? 0;
  const finished = enrollment?.status === 'completed';
  const aboutParagraphs = [
    course.description,
    `Across ${chapters?.length ?? 3} chapters and ${course.lessonsCount} lessons you will move from first principles to hands-on practice, finishing with a project you can show to others.`,
    `Taught in ${course.language} at ${course.level === 'All Levels' ? 'every' : `${course.level.toLowerCase()}`} level, with about ${course.duration} hours of focused content you can complete at your own pace.`,
  ];

  const confirm = async (): Promise<void> => {
    if (!user) return;
    setEnrolling(true);
    setEnrollError(null);
    const result = await dispatch(enrollInCourse({ studentId: user.id, courseId: course.id }));
    setEnrolling(false);
    if (enrollInCourse.fulfilled.match(result)) {
      setModal(false);
      toast.success('Enrollment confirmed', `You are now enrolled in ${course.title}.`);
      navigate('/my-learning');
    } else {
      setEnrollError(result.payload ?? 'Enrollment failed. Please try again.');
    }
  };

  const firstLesson = chapters?.[0]?.lessons[0];
  const cta = !enrollment ? (
    <Button size="lg" fullWidth onClick={() => setModal(true)}>Enroll Now</Button>
  ) : finished ? (
    <div className="space-y-2">
      <Link to={`/certificates?view=${course.id}`} className={buttonStyles('primary', 'lg', true)}><Award className="mr-2 h-5 w-5" aria-hidden />View Certificate</Link>
      <Link to={learnPath(course.id, (firstLesson ?? resume)?.id ?? '')} className={buttonStyles('outline', 'lg', true)}>Review Course</Link>
    </div>
  ) : (
    <Link to={resume ? learnPath(course.id, resume.id) : '/my-learning'} className={buttonStyles('primary', 'lg', true)}>Continue Learning</Link>
  );

  return (
    <motion.div variants={slideUp} initial="hidden" animate="visible">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="min-w-0 space-y-8 lg:col-span-2">
          <header>
            <div className="flex flex-wrap items-center gap-2"><Badge variant="brand">{course.category}</Badge><Badge>{course.level}</Badge>{course.featured && <Badge variant="warning">Featured</Badge>}</div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-fg sm:text-4xl">{course.title}</h1>
            <p className="mt-3 max-w-3xl text-lg text-muted">{course.subtitle ?? course.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
              <Rating value={average} count={courseReviews.length} size="md" />
              <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" aria-hidden />{formatCompact(course.studentsCount)} students</span>
              <span>Created by <span className="font-medium text-fg">{instructorName}</span></span>
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
              <li className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" aria-hidden />{course.duration} hours</li>
              <li className="inline-flex items-center gap-1.5"><BookOpen className="h-4 w-4" aria-hidden />{course.lessonsCount} lessons</li>
              <li className="inline-flex items-center gap-1.5"><Globe className="h-4 w-4" aria-hidden />{course.language}</li>
              <li className="inline-flex items-center gap-1.5"><Layers className="h-4 w-4" aria-hidden />Updated {formatDate(course.createdAt)}</li>
            </ul>
          </header>

          {content && content.outcomes.length > 0 && (
            <Card>
              <CardHeader title="What you'll learn" />
              <ul className="grid gap-3 sm:grid-cols-2">
                {content.outcomes.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-fg"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-hidden />{item}</li>
                ))}
              </ul>
            </Card>
          )}

          <section aria-labelledby="curriculum-heading">
            <h2 id="curriculum-heading" className="mb-1 text-xl font-semibold text-fg">Course curriculum</h2>
            <p className="mb-3 text-sm text-muted">{chapters ? `${chapters.length} chapters · ${course.lessonsCount} lessons · ${course.duration} hours` : 'Loading curriculum…'}</p>
            {curriculumError ? <ErrorState message={curriculumError} onRetry={() => void dispatch(fetchCurriculum(course.id))} /> : chapters ? <CurriculumAccordion chapters={chapters} completedIds={enrollment ? completed : []} /> : <Skeleton className="h-48 rounded-xl" />}
          </section>

          {content && content.requirements.length > 0 && (
            <Card>
              <CardHeader title="Requirements" />
              <ul className="list-disc space-y-2 pl-5 text-sm text-fg marker:text-muted">{content.requirements.map((r) => <li key={r}>{r}</li>)}</ul>
            </Card>
          )}

          <Card>
            <CardHeader title="About this course" />
            <div className="max-w-prose space-y-3 text-sm leading-7 text-muted">{aboutParagraphs.map((p) => <p key={p}>{p}</p>)}</div>
          </Card>

          {instructor && <Card><CardHeader title="Your instructor" /><InstructorCard instructor={instructor} /></Card>}

          <Card><CardHeader title="Student reviews" /><ReviewsSection reviews={courseReviews} students={students} average={average} /></Card>

          <Card>
            <CardHeader title="Frequently asked questions" />
            {FAQS.map((faq) => <AccordionItem key={faq.question} title={faq.question}><p className="text-sm leading-relaxed text-muted">{faq.answer}</p></AccordionItem>)}
          </Card>
        </div>

        <aside className="lg:col-span-1">
          <Card padded={false} className="overflow-hidden lg:sticky lg:top-24">
            <CourseThumbnail src={course.thumbnail} alt={`${course.title} thumbnail`} className="aspect-video w-full" />
            <div className="space-y-4 p-5">
              {enrollment ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-fg">{finished ? 'Completed' : 'Your progress'}</span>
                    {finished && <Badge variant="success">Certificate available</Badge>}
                  </div>
                  <ProgressBar value={progress} showLabel tone={finished ? 'success' : 'brand'} label={`${course.title} progress`} />
                </div>
              ) : (
                <PriceTag price={course.price} discount={course.discount} size="lg" />
              )}
              {cta}
              <WishlistButton courseId={course.id} courseTitle={course.title} withLabel className="w-full rounded-xl border border-line py-2.5 hover:bg-subtle" />
              <ul className="space-y-2.5 border-t border-line pt-4 text-sm text-muted">
                <li className="flex items-center gap-2.5"><Clock className="h-4 w-4" aria-hidden />{course.duration} hours of content</li>
                <li className="flex items-center gap-2.5"><BookOpen className="h-4 w-4" aria-hidden />{course.lessonsCount} lessons with quizzes and assignments</li>
                <li className="flex items-center gap-2.5"><Smartphone className="h-4 w-4" aria-hidden />Access on mobile and desktop</li>
                <li className="flex items-center gap-2.5"><Award className="h-4 w-4" aria-hidden />Certificate of completion</li>
              </ul>
            </div>
          </Card>
        </aside>
      </div>

      <section className="mt-12" aria-labelledby="related-heading">
        <h2 id="related-heading" className="mb-4 text-xl font-semibold text-fg">Related courses</h2>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {related.map((c, i) => <CourseCard key={c.id} course={c} index={i} instructorName={names[c.instructorId] ?? 'LearnSphere instructor'} reviewCount={reviewStats[c.id]?.count ?? 0} />)}
        </div>
      </section>

      <EnrollModal course={course} instructorName={instructorName} open={modal} loading={enrolling} error={enrollError} onClose={() => setModal(false)} onConfirm={() => void confirm()} />
    </motion.div>
  );
}
