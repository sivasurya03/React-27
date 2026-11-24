import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Award, CheckCircle2, ListVideo, Lock, SearchX, Undo2 } from 'lucide-react';
import { CourseThumbnail } from '@/components/common/CourseThumbnail';
import { LearnSkeleton } from '@/components/learning/LearnSkeleton';
import { AssignmentPanel } from '@/components/learning/AssignmentPanel';
import { CompletionScreen } from '@/components/learning/CompletionScreen';
import { CurriculumPanel } from '@/components/learning/CurriculumPanel';
import { NotesPanel } from '@/components/learning/NotesPanel';
import { QuizPlayer } from '@/components/learning/QuizPlayer';
import { ResourcesPanel } from '@/components/learning/ResourcesPanel';
import { VideoPlayer } from '@/components/learning/VideoPlayer';
import { Badge, Button, buttonStyles, Card, Drawer, EmptyState, ErrorState, ProgressBar, Tabs, useToast } from '@/components/ui';
import { assignmentBrief, captionLines, lessonOverview, PASS_MARK, quizFor, resourcesFor } from '@/data/learningContent';
import { fetchCourses, fetchCurriculum } from '@/features/courses/courseSlice';
import { saveAssignment, saveNotes, setLastAccessed } from '@/features/learning/learningSlice';
import { setLessonComplete, submitAssignment, submitQuiz } from '@/features/learning/learningThunks';
import { touchEnrollment } from '@/features/enrollment/enrollmentSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/selectors';
import { courseProgress, flat, isLocked, learnPath, neighbours, resumeLesson } from '@/utils/learning';

export default function Learn() {
  const { courseId = '', lessonId = '' } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAppSelector(selectCurrentUser);
  const { items, status, error, curricula, curriculumError } = useAppSelector((state) => state.courses);
  const enrollments = useAppSelector((state) => state.enrollment.items);
  const learning = useAppSelector((state) => state.learning);

  const [tab, setTab] = useState('overview');
  const [drawer, setDrawer] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const course = items.find((c) => c.id === courseId);
  const chapters = curricula[courseId];
  const enrollment = enrollments.find((e) => e.studentId === user?.id && e.courseId === courseId && !e.adminStatus);
  const completedIds = useMemo(() => learning.completedLessons[courseId] ?? [], [learning.completedLessons, courseId]);
  const lessons = useMemo(() => (chapters ? flat(chapters) : []), [chapters]);
  const lesson = lessons.find((l) => l.id === lessonId);
  const locked = chapters && lesson ? isLocked(chapters, lesson, completedIds) : false;
  const canView = Boolean(enrollment && lesson && !locked);

  useEffect(() => {
    if (course && !chapters) void dispatch(fetchCurriculum(course.id));
  }, [course, chapters, dispatch]);

  useEffect(() => {
    if (canView && user) {
      dispatch(setLastAccessed({ courseId, lessonId }));
      dispatch(touchEnrollment({ studentId: user.id, courseId }));
    }
  }, [canView, courseId, lessonId, user, dispatch]);

  if (status === 'failed') return <ErrorState message={error ?? undefined} onRetry={() => void dispatch(fetchCourses())} />;
  if (status !== 'succeeded') return <LearnSkeleton />;
  if (!course) {
    return <Card><EmptyState icon={SearchX} title="Course not found" description="This course does not exist or the link is incorrect." action={<Link to="/courses" className={buttonStyles('primary')}>Browse courses</Link>} /></Card>;
  }
  if (!enrollment) {
    return (
      <Card>
        <EmptyState icon={Lock} title="Enrol to access this course" description={`You need to be enrolled in “${course.title}” to open its lessons.`} action={<Link to={`/courses/${course.id}`} className={buttonStyles('primary')}>View course and enrol</Link>} />
      </Card>
    );
  }
  if (curriculumError && !chapters) return <ErrorState title="Curriculum unavailable" message={curriculumError} onRetry={() => void dispatch(fetchCurriculum(course.id))} />;
  if (!chapters) return <LearnSkeleton />;
  if (lessons.length === 0) return <Card><EmptyState title="No lessons yet" description="Lessons for this course have not been published." action={<Link to={`/courses/${course.id}`} className={buttonStyles('outline')}>Back to course</Link>} /></Card>;

  const resume = resumeLesson(chapters, completedIds, learning.lastAccessed[courseId]?.lessonId);
  if (!lesson) {
    return <Card><EmptyState icon={SearchX} title="Lesson not found" description="This lesson is not part of the course." action={resume ? <Link to={learnPath(courseId, resume.id)} className={buttonStyles('primary')}>Go to current lesson</Link> : undefined} /></Card>;
  }

  const progress = courseProgress(chapters, completedIds);
  const done = completedIds.includes(lesson.id);
  const { prev, next } = neighbours(chapters, lesson.id);
  const certificate = learning.certificates.find((c) => c.courseId === courseId && c.studentId === user?.id);
  const certificateHref = `/certificates?view=${courseId}`;
  const chapter = chapters.find((c) => c.id === lesson.chapterId);
  const overview = lessonOverview(lesson, course.title);
  const goNext = (): void => navigate(next ? learnPath(courseId, next.id) : `/courses/${courseId}`);

  const afterCompletion = (result: { courseCompleted: boolean }): void => {
    if (result.courseCompleted) setCelebrate(true);
    else if (next) goNext();
  };
  const markComplete = (): void => {
    const result = dispatch(setLessonComplete(courseId, lesson.id, true));
    toast.success('Lesson completed', lesson.title);
    afterCompletion(result);
  };
  const markIncomplete = (): void => {
    dispatch(setLessonComplete(courseId, lesson.id, false));
    toast.info('Marked as not completed');
  };

  if (celebrate) {
    return <CompletionScreen courseTitle={course.title} certificateHref={certificateHref} onReview={() => { setCelebrate(false); navigate(learnPath(courseId, lessons[0].id)); }} />;
  }

  const curriculum = (onNavigate?: () => void) => (
    <CurriculumPanel courseId={courseId} chapters={chapters} completedIds={completedIds} activeLessonId={lesson.id} progress={progress} onNavigate={onNavigate} />
  );

  let main: ReactNode;
  if (locked) {
    main = (
      <Card><EmptyState icon={Lock} title="This lesson is locked" description="Complete the earlier lessons in this chapter to unlock it." action={resume && resume.id !== lesson.id ? <Link to={learnPath(courseId, resume.id)} className={buttonStyles('primary')}>Go to your next lesson</Link> : undefined} /></Card>
    );
  } else if (lesson.type === 'quiz') {
    main = (
      <QuizPlayer
        key={lesson.id}
        title={lesson.title}
        questions={quizFor(courseId, lesson.id)}
        passMark={PASS_MARK}
        result={learning.quizResults[lesson.id]}
        hasNext={Boolean(next)}
        onSubmit={(answers) => {
          const { result, completion } = dispatch(submitQuiz(courseId, lesson.id, lesson.title, quizFor(courseId, lesson.id), answers, PASS_MARK));
          if (result.passed) toast.success('Quiz passed', `${result.score}/${result.total} correct`);
          else toast.info('Quiz not passed yet', 'Review the answers and try again.');
          if (completion?.courseCompleted) setCelebrate(true);
        }}
        onContinue={goNext}
      />
    );
  } else if (lesson.type === 'assignment') {
    const brief = assignmentBrief(courseId, lesson.id);
    main = (
      <AssignmentPanel
        key={lesson.id}
        title={lesson.title}
        instructions={brief.instructions}
        maxScore={brief.maxScore}
        dueAt={new Date(new Date(enrollment.enrolledAt).getTime() + brief.dueDays * 86_400_000).toISOString()}
        submission={learning.assignments[lesson.id]}
        hasNext={Boolean(next)}
        onSaveDraft={(draft) => dispatch(saveAssignment({ lessonId: lesson.id, submission: { ...draft, status: 'in-progress', updatedAt: new Date().toISOString() } }))}
        onSubmit={(draft) => {
          const result = dispatch(submitAssignment(courseId, lesson.id, lesson.title, draft));
          toast.success('Assignment submitted', lesson.title);
          if (result.courseCompleted) setCelebrate(true);
        }}
        onContinue={goNext}
      />
    );
  } else if (lesson.type === 'video') {
    main = <VideoPlayer key={lesson.id} title={lesson.title} poster={course.thumbnail} durationSec={lesson.duration * 60} completed={done} captions={captionLines(lesson)} onMarkComplete={markComplete} />;
  } else if (lesson.type === 'article') {
    main = (
      <Card>
        <Badge variant="info">Reading</Badge>
        <h2 className="mt-3 text-xl font-semibold text-fg">{lesson.title}</h2>
        <div className="mt-3 max-w-prose space-y-3 text-sm leading-7 text-muted">
          <p>{overview.summary}</p>
          {overview.points.map((point) => <p key={point}>• {point}</p>)}
        </div>
      </Card>
    );
  } else {
    main = (
      <Card>
        <Badge variant="info">Resources</Badge>
        <h2 className="mb-4 mt-3 text-xl font-semibold text-fg">{lesson.title}</h2>
        <ResourcesPanel resources={resourcesFor(courseId, course.title, lesson.id)} courseTitle={course.title} />
      </Card>
    );
  }

  const selfCompleting = lesson.type === 'quiz' || lesson.type === 'assignment';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <header className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        <Link to={`/courses/${courseId}`} className={buttonStyles('ghost', 'sm')}><ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />Back to course</Link>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <CourseThumbnail src={course.thumbnail} alt="" className="hidden h-9 w-14 shrink-0 rounded-md sm:block" />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">{course.title}</p>
        </div>
        <div className="w-full sm:w-56"><ProgressBar value={progress} showLabel size="sm" label="Course progress" /></div>
        <Button className="lg:hidden" variant="outline" size="sm" onClick={() => setDrawer(true)} leftIcon={<ListVideo className="h-4 w-4" />}>Curriculum</Button>
      </header>

      {progress === 100 && certificate && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300"><Award className="h-5 w-5" aria-hidden />You completed this course. Your certificate is ready.</p>
          <Link to={certificateHref} className={buttonStyles('outline', 'sm')}>View Certificate</Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-5">
          {main}

          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">{chapter?.title}</p>
                <h1 className="mt-1 text-xl font-bold tracking-tight text-fg sm:text-2xl">{lesson.title}</h1>
                <p className="mt-1 text-sm text-muted">{lesson.duration} min · {done ? 'Completed' : 'Not completed'}</p>
              </div>
              {done && <Badge variant="success"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden />Completed</Badge>}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="outline" disabled={!prev} onClick={() => prev && navigate(learnPath(courseId, prev.id))} leftIcon={<ArrowLeft className="h-4 w-4" />}>Previous</Button>
              {!locked && !selfCompleting && (done
                ? <Button variant="ghost" onClick={markIncomplete} leftIcon={<Undo2 className="h-4 w-4" />}>Mark as incomplete</Button>
                : <Button onClick={markComplete} leftIcon={<CheckCircle2 className="h-4 w-4" />}>Mark as Complete</Button>)}
              <Button className="ml-auto" variant={done || selfCompleting ? 'primary' : 'outline'} disabled={!next} onClick={goNext}>
                {next ? 'Next lesson' : 'Last lesson'}<ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Button>
            </div>

            <Tabs className="mt-6" value={tab} onChange={setTab} tabs={[{ id: 'overview', label: 'Overview' }, { id: 'notes', label: 'Notes' }, { id: 'resources', label: 'Resources' }]} />
            <div className="pt-5" role="tabpanel">
              {tab === 'overview' && (
                <div className="max-w-prose space-y-3 text-sm leading-7 text-muted">
                  <p>{overview.summary}</p>
                  <ul className="list-disc space-y-1 pl-5 marker:text-muted">{overview.points.map((p) => <li key={p}>{p}</li>)}</ul>
                </div>
              )}
              {tab === 'notes' && <NotesPanel key={lesson.id} saved={learning.notes[lesson.id] ?? ''} onSave={(text) => dispatch(saveNotes({ lessonId: lesson.id, text }))} />}
              {tab === 'resources' && <ResourcesPanel resources={resourcesFor(courseId, course.title, lesson.id)} courseTitle={course.title} />}
            </div>
          </Card>
        </div>

        <aside className="hidden lg:block">
          <Card padded={false} className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">{curriculum()}</Card>
        </aside>
      </div>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Curriculum" side="right">{curriculum(() => setDrawer(false))}</Drawer>
    </motion.div>
  );
}
