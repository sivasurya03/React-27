import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ImagePlus, Plus, Save, SearchX, Send, Trash2, XCircle } from 'lucide-react';
import { CourseThumbnail } from '@/components/common/CourseThumbnail';
import { PriceTag } from '@/components/courses/PriceTag';
import { CoursePreviewView } from '@/components/instructor/CoursePreviewView';
import { CurriculumBuilder } from '@/components/instructor/CurriculumBuilder';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/common/PageSkeleton';
import { Button, buttonStyles, Card, CardHeader, ConfirmDialog, EmptyState, ErrorState, Input, Select, Switch, Textarea, useToast } from '@/components/ui';
import { fetchCourses, fetchCurriculum, saveCourse } from '@/features/courses/courseSlice';
import { addNotification } from '@/features/notifications/notificationSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/selectors';
import { COURSE_CATEGORIES, type Course, type CourseLevel } from '@/types';
import { cn } from '@/utils/cn';
import {
  buildCourse, durationHours, draftFromCourse, emptyDraft, firstPublishBlocker, lessonCount, newCourseId,
  validateBasics, validateCurriculum, validatePricing, type BasicErrors, type CourseDraft, type PricingErrors,
} from '@/utils/courseBuilder';
import { formatCurrency } from '@/utils/format';
import { fileToThumbnail } from '@/utils/image';
import { makeThumbnail } from '@/utils/thumbnail';

const STEPS = ['Basics', 'Pricing', 'Thumbnail', 'Curriculum', 'Publish'];
const LEVELS: CourseLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];
const FEE = 0.2;

function LineListEditor({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (next: string[]) => void; placeholder: string }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-fg">{label}</legend>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input value={item} onChange={(e) => onChange(items.map((x, n) => (n === i ? e.target.value : x)))} aria-label={`${label} ${i + 1}`} placeholder={placeholder} className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30" />
            <Button variant="ghost" aria-label={`Remove ${label} ${i + 1}`} disabled={items.length === 1 && !item} onClick={() => onChange(items.length > 1 ? items.filter((_, n) => n !== i) : [''])}><Trash2 className="h-4 w-4 text-rose-600" /></Button>
          </div>
        ))}
      </div>
      <Button className="mt-2" size="sm" variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => onChange([...items, ''])}>Add</Button>
    </fieldset>
  );
}

function Wizard({ initial, existing }: { initial: CourseDraft; existing?: Course }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAppSelector(selectCurrentUser);
  const instructors = useAppSelector((state) => state.instructors.items);
  const approvals = useAppSelector((state) => state.admin.settings.courseApprovals);
  const instructorApprovals = useAppSelector((state) => state.admin.settings.instructorApprovals);
  const fileRef = useRef<HTMLInputElement>(null);
  const [courseId] = useState(() => existing?.id ?? newCourseId());
  const [draft, setDraft] = useState<CourseDraft>(initial);
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(existing ? STEPS.length - 1 : 0);
  const [basicErrors, setBasicErrors] = useState<BasicErrors>({});
  const [priceErrors, setPriceErrors] = useState<PricingErrors>({});
  const [curriculumError, setCurriculumError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [showStudentView, setShowStudentView] = useState(false);

  const patch = (changes: Partial<CourseDraft>): void => setDraft((d) => ({ ...d, ...changes }));
  const isLive = existing?.status === 'published';
  const needsReview = approvals && !isLive && existing?.status !== 'pending';
  const instructorStatus = instructors.find((i) => i.id === user?.id)?.status;
  const price = draft.pricing === 'free' ? 0 : Number(draft.price) || 0;
  const discountPrice = Number(draft.discountPrice) || 0;
  const finalPrice = price > 0 && discountPrice > 0 && discountPrice < price ? discountPrice : price;
  const preview = useMemo(() => user ? buildCourse(draft, courseId, user.id, existing?.status ?? 'draft', existing) : null, [draft, courseId, user, existing]);

  const validateStep = (index: number): boolean => {
    if (index === 0) { const e = validateBasics(draft); setBasicErrors(e); return Object.keys(e).length === 0; }
    if (index === 1) { const e = validatePricing(draft); setPriceErrors(e); return Object.keys(e).length === 0; }
    if (index === 3) { const e = validateCurriculum(draft); setCurriculumError(e); return !e; }
    return true;
  };
  const next = (): void => { if (validateStep(step)) { setStep(step + 1); setReached((r) => Math.max(r, step + 1)); } };
  const jump = (index: number): void => { if (index <= reached) setStep(index); };

  const persist = async (status: Course['status'], message: string): Promise<boolean> => {
    if (!user) return false;
    setSaving(true);
    const result = await dispatch(saveCourse({ course: buildCourse(draft, courseId, user.id, status, existing), chapters: draft.chapters, content: draft.content }));
    setSaving(false);
    if (saveCourse.fulfilled.match(result)) { toast.success(message, draft.title.trim()); return true; }
    toast.error('Could not save the course', result.payload ?? 'Please try again.');
    return false;
  };

  const saveDraft = async (): Promise<void> => {
    const titleError = validateBasics(draft).title;
    if (titleError) { setBasicErrors(validateBasics(draft)); setStep(0); toast.error('Add a title first', titleError); return; }
    if (await persist(existing?.status ?? 'draft', isLive ? 'Changes saved' : 'Draft saved')) navigate('/instructor/courses');
  };

  const publish = async (): Promise<void> => {
    const blocker = firstPublishBlocker(draft);
    setConfirmPublish(false);
    if (blocker) {
      setBasicErrors(validateBasics(draft)); setPriceErrors(validatePricing(draft)); setCurriculumError(validateCurriculum(draft));
      setStep(blocker.step); setReached((r) => Math.max(r, blocker.step));
      toast.error('This course is not ready to publish', blocker.message);
      return;
    }
    if (instructorApprovals && instructorStatus === 'pending') {
      toast.error('Your instructor account is awaiting approval', 'An administrator must approve it before you can publish.');
      return;
    }
    const target: Course['status'] = isLive ? 'published' : needsReview ? 'pending' : existing?.status === 'pending' ? 'pending' : 'published';
    if (await persist(target, isLive ? 'Changes published' : target === 'pending' ? 'Submitted for review' : 'Course published')) {
      if (target === 'pending' && existing?.status !== 'pending') dispatch(addNotification({ type: 'course-update', title: 'Course submitted for review', message: `${draft.title.trim()} is waiting for administrator approval.`, audience: 'admin' }));
      else if (!isLive) dispatch(addNotification({ type: 'course-update', title: 'Course published', message: `${draft.title.trim()} is now live for students.`, audience: 'instructor' }));
      navigate('/instructor/courses');
    }
  };

  const onThumb = async (file?: File): Promise<void> => {
    if (!file) return;
    try { patch({ thumbnail: await fileToThumbnail(file) }); toast.success('Thumbnail updated'); }
    catch (error) { toast.error('Could not use that image', error instanceof Error ? error.message : undefined); }
  };

  const blockers = [
    { ok: !Object.keys(validateBasics(draft)).length, label: 'Basic information is complete' },
    { ok: !Object.keys(validatePricing(draft)).length, label: 'Pricing is valid' },
    { ok: !validateCurriculum(draft), label: 'Curriculum has chapters and lessons, and every quiz and assignment is complete' },
  ];

  return (
    <>
      <nav aria-label="Course creation steps" className="mb-6">
        <ol className="flex gap-2 overflow-x-auto pb-1">
          {STEPS.map((label, i) => (
            <li key={label} className="min-w-fit flex-1">
              <button type="button" onClick={() => jump(i)} disabled={i > reached} aria-current={i === step ? 'step' : undefined}
                className={cn('flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50', i === step ? 'border-brand bg-brand/10 text-brand-text' : 'border-line bg-surface text-muted hover:text-fg')}>
                <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold', i < step || (i <= reached && i !== step) ? 'bg-emerald-500 text-white' : i === step ? 'bg-brand text-brand-fg' : 'bg-subtle')}>{i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}</span>
                <span className="font-medium">{label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
          {step === 0 && (
            <Card>
              <CardHeader title="Basic information" subtitle="Tell students what your course is about" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><Input label="Course title" value={draft.title} onChange={(e) => patch({ title: e.target.value })} error={basicErrors.title} maxLength={90} /></div>
                <div className="sm:col-span-2"><Input label="Subtitle (optional)" value={draft.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} maxLength={120} /></div>
                <div className="sm:col-span-2"><Textarea label="Description" rows={5} value={draft.description} onChange={(e) => patch({ description: e.target.value })} error={basicErrors.description} hint={`${draft.description.trim().length} characters`} /></div>
                <Select label="Category" value={draft.category} onChange={(e) => patch({ category: e.target.value as CourseDraft['category'] })} error={basicErrors.category} options={[{ value: '', label: 'Select a category' }, ...COURSE_CATEGORIES.map((c) => ({ value: c, label: c }))]} />
                <Select label="Level" value={draft.level} onChange={(e) => patch({ level: e.target.value as CourseDraft['level'] })} error={basicErrors.level} options={[{ value: '', label: 'Select a level' }, ...LEVELS.map((l) => ({ value: l, label: l }))]} />
                <Input label="Language" value={draft.language} onChange={(e) => patch({ language: e.target.value })} error={basicErrors.language} />
                <Input label="Tags" value={draft.tags} onChange={(e) => patch({ tags: e.target.value })} hint="Separate with commas, e.g. react, hooks" />
                <LineListEditor label="What students will learn" items={draft.outcomes} onChange={(outcomes) => patch({ outcomes })} placeholder="e.g. Build typed React components" />
                <LineListEditor label="Requirements" items={draft.requirements} onChange={(requirements) => patch({ requirements })} placeholder="e.g. Basic JavaScript" />
              </div>
            </Card>
          )}

          {step === 1 && (
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader title="Pricing" subtitle="Set what students pay" />
                <div className="space-y-4">
                  <div role="radiogroup" aria-label="Pricing model" className="grid grid-cols-2 gap-2">
                    <Button role="radio" aria-checked={draft.pricing === 'paid'} variant={draft.pricing === 'paid' ? 'primary' : 'outline'} onClick={() => patch({ pricing: 'paid' })}>Paid</Button>
                    <Button role="radio" aria-checked={draft.pricing === 'free'} variant={draft.pricing === 'free' ? 'primary' : 'outline'} onClick={() => { patch({ pricing: 'free' }); setPriceErrors({}); }}>Free</Button>
                  </div>
                  {draft.pricing === 'paid' && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input label="Price (USD)" type="number" min={1} step="0.01" value={draft.price} onChange={(e) => patch({ price: e.target.value })} error={priceErrors.price} />
                      <Input label="Discount price (optional)" type="number" min={0} step="0.01" value={draft.discountPrice} onChange={(e) => patch({ discountPrice: e.target.value })} error={priceErrors.discountPrice} />
                    </div>
                  )}
                  <Switch checked={draft.subscription} onChange={(subscription) => patch({ subscription })} label="Available through subscription" description="Subscribers can access this course without buying it separately." />
                </div>
              </Card>
              <Card>
                <CardHeader title="Pricing preview" />
                {draft.pricing === 'free' ? <p className="text-3xl font-bold text-fg">Free</p> : price > 0 ? <PriceTag price={price} discount={finalPrice < price ? Math.round((1 - finalPrice / price) * 100) : 0} size="lg" /> : <p className="text-sm text-muted">Enter a price to see the preview.</p>}
                {finalPrice > 0 && (
                  <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                    <div className="flex justify-between"><dt className="text-muted">Student pays</dt><dd className="text-fg">{formatCurrency(finalPrice)}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Platform fee (20%)</dt><dd className="text-fg">-{formatCurrency(Math.round(finalPrice * FEE * 100) / 100)}</dd></div>
                    <div className="flex justify-between font-semibold"><dt className="text-fg">You earn</dt><dd className="text-fg">{formatCurrency(Math.round(finalPrice * (1 - FEE) * 100) / 100)}</dd></div>
                  </dl>
                )}
              </Card>
            </div>
          )}

          {step === 2 && (
            <Card>
              <CardHeader title="Course thumbnail" subtitle="Shown on course cards and the course page (16:9 works best)" />
              <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_16rem] sm:items-start">
                <CourseThumbnail src={draft.thumbnail || makeThumbnail(draft.category || 'Web Development', courseId)} alt="Thumbnail preview" className="aspect-video w-full rounded-2xl border border-line" />
                <div className="space-y-3">
                  <input ref={fileRef} type="file" accept="image/*" className="sr-only" aria-label="Upload thumbnail" onChange={(e) => { void onThumb(e.target.files?.[0]); e.target.value = ''; }} />
                  <Button fullWidth leftIcon={<ImagePlus className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>{draft.thumbnail ? 'Replace image' : 'Upload image'}</Button>
                  {draft.thumbnail && <Button fullWidth variant="outline" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => patch({ thumbnail: '' })}>Remove image</Button>}
                  <p className="text-xs text-muted">{draft.thumbnail ? 'Custom image (stored on this device in the demo).' : 'No image uploaded: a generated cover is used.'} JPG or PNG up to 3 MB.</p>
                </div>
              </div>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader title="Curriculum" subtitle="Chapters, lessons, quizzes, assignments and resources" />
              <CurriculumBuilder courseId={courseId} chapters={draft.chapters} content={draft.content} error={curriculumError} onChange={(chapters, content) => { patch({ chapters, content }); setCurriculumError(undefined); }} />
            </Card>
          )}

          {step === 4 && preview && (
            <div className="space-y-6">
              <Card>
                <CardHeader title="Review and publish" subtitle="Check everything before students see it" />
                <div className="grid gap-5 sm:grid-cols-[14rem_minmax(0,1fr)]">
                  <CourseThumbnail src={preview.thumbnail} alt="" className="aspect-video w-full rounded-xl" />
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-fg">{preview.title || 'Untitled course'}</h3>
                    <p className="text-sm text-muted">by {instructors.find((i) => i.id === user?.id)?.name ?? user?.name}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                      <div><dt className="text-muted">Price</dt><dd className="font-medium text-fg">{price === 0 ? 'Free' : formatCurrency(finalPrice)}</dd></div>
                      <div><dt className="text-muted">Chapters</dt><dd className="font-medium text-fg">{draft.chapters.length}</dd></div>
                      <div><dt className="text-muted">Lessons</dt><dd className="font-medium text-fg">{lessonCount(draft.chapters)}</dd></div>
                      <div><dt className="text-muted">Est. duration</dt><dd className="font-medium text-fg">{durationHours(draft.chapters)} h</dd></div>
                    </dl>
                  </div>
                </div>
                <ul className="mt-5 space-y-2">
                  {blockers.map((b) => (
                    <li key={b.label} className="flex items-center gap-2 text-sm">{b.ok ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-label="Done" /> : <XCircle className="h-5 w-5 shrink-0 text-rose-500" aria-label="Missing" />}<span className="text-fg">{b.label}</span></li>
                  ))}
                </ul>
                <Button className="mt-4" variant="ghost" onClick={() => setShowStudentView((v) => !v)}>{showStudentView ? 'Hide student view' : 'Show student view'}</Button>
              </Card>
              {showStudentView && <CoursePreviewView course={preview} chapters={draft.chapters} instructor={instructors.find((i) => i.id === user?.id)} />}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="sticky bottom-0 z-10 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-app/95 py-4 backdrop-blur">
        <Button variant="outline" disabled={step === 0 || saving} onClick={() => setStep(step - 1)} leftIcon={<ArrowLeft className="h-4 w-4" />}>Back</Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" loading={saving} onClick={() => void saveDraft()} leftIcon={<Save className="h-4 w-4" />}>{isLive ? 'Save changes' : 'Save Draft'}</Button>
          {step < STEPS.length - 1 ? <Button onClick={next}>Next<ArrowRight className="ml-2 h-4 w-4" aria-hidden /></Button> : <Button loading={saving} onClick={() => setConfirmPublish(true)} leftIcon={<Send className="h-4 w-4" />}>{isLive ? 'Publish changes' : needsReview ? 'Submit for review' : 'Publish Course'}</Button>}
        </div>
      </div>

      <ConfirmDialog open={confirmPublish} title={isLive ? 'Publish your changes?' : needsReview ? 'Submit for review?' : 'Publish this course?'} confirmLabel={needsReview ? 'Submit' : 'Publish'} loading={saving} onConfirm={() => void publish()} onClose={() => setConfirmPublish(false)}>
        {needsReview ? `An administrator will review “${draft.title.trim() || 'this course'}” before it goes live.` : `Students will be able to find and enrol in “${draft.title.trim() || 'this course'}” right away.`}
      </ConfirmDialog>
    </>
  );
}

export default function CourseEditor() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const { items, status, error, curricula, lessonContent } = useAppSelector((state) => state.courses);
  const course = id ? items.find((c) => c.id === id && c.instructorId === user?.id) : undefined;
  const chapters = id ? curricula[id] : undefined;

  useEffect(() => {
    if (id && course && !chapters) void dispatch(fetchCurriculum(id));
  }, [id, course, chapters, dispatch]);

  const initial = useMemo(() => (course && chapters ? draftFromCourse(course, chapters, lessonContent) : null), [course, chapters, lessonContent]);

  if (!id) return (<><PageHeader title="Create course" description="Build and publish a new course in five steps." /><Wizard key="new" initial={emptyDraft()} /></>);
  if (status === 'failed') return <ErrorState message={error ?? undefined} onRetry={() => void dispatch(fetchCourses())} />;
  if (status !== 'succeeded' || (course && !chapters)) return <PageSkeleton />;
  if (!course || !initial) {
    return <Card><EmptyState icon={SearchX} title="Course not found" description="This course does not exist or you do not have permission to edit it." action={<Link to="/instructor/courses" className={buttonStyles('primary')}>Back to my courses</Link>} /></Card>;
  }
  return (<><PageHeader title="Edit course" description={course.title} /><Wizard key={id} initial={initial} existing={course} /></>);
}
