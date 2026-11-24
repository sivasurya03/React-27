import { BookOpen, CheckCircle2, Clock, Globe, Users } from 'lucide-react';
import { CourseThumbnail } from '@/components/common/CourseThumbnail';
import { CurriculumAccordion } from '@/components/courses/CurriculumAccordion';
import { InstructorCard } from '@/components/courses/InstructorCard';
import { PriceTag } from '@/components/courses/PriceTag';
import { Rating } from '@/components/courses/Rating';
import { Badge, Button, Card, CardHeader } from '@/components/ui';
import type { Chapter, Course, Instructor } from '@/types';
import { formatCompact } from '@/utils/format';

/** Student-facing course page, rendered read-only for instructors (reuses the student visual language). */
export function CoursePreviewView({ course, chapters, instructor }: { course: Course; chapters: Chapter[]; instructor?: Instructor }) {
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="min-w-0 space-y-6 lg:col-span-2">
        <header>
          <div className="flex flex-wrap items-center gap-2"><Badge variant="brand">{course.category}</Badge><Badge>{course.level}</Badge></div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-fg">{course.title || 'Untitled course'}</h2>
          {course.subtitle && <p className="mt-2 text-lg text-muted">{course.subtitle}</p>}
          <p className="mt-3 max-w-3xl text-muted">{course.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
            {course.rating > 0 ? <Rating value={course.rating} size="md" /> : <span>No ratings yet</span>}
            <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" aria-hidden />{formatCompact(course.studentsCount)} students</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" aria-hidden />{course.duration} hours</span>
            <span className="inline-flex items-center gap-1.5"><BookOpen className="h-4 w-4" aria-hidden />{course.lessonsCount} lessons</span>
            <span className="inline-flex items-center gap-1.5"><Globe className="h-4 w-4" aria-hidden />{course.language}</span>
          </div>
        </header>
        {course.outcomes && course.outcomes.length > 0 && (
          <Card><CardHeader title="What you'll learn" />
            <ul className="grid gap-3 sm:grid-cols-2">{course.outcomes.map((o) => <li key={o} className="flex gap-3 text-sm text-fg"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-hidden />{o}</li>)}</ul>
          </Card>
        )}
        <section aria-labelledby="preview-curriculum">
          <h3 id="preview-curriculum" className="mb-3 text-xl font-semibold text-fg">Course curriculum</h3>
          {chapters.length > 0 ? <CurriculumAccordion chapters={chapters} completedIds={[]} /> : <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">No curriculum yet.</p>}
        </section>
        {course.requirements && course.requirements.length > 0 && (
          <Card><CardHeader title="Requirements" /><ul className="list-disc space-y-2 pl-5 text-sm text-fg marker:text-muted">{course.requirements.map((r) => <li key={r}>{r}</li>)}</ul></Card>
        )}
        {instructor && <Card><CardHeader title="Your instructor" /><InstructorCard instructor={instructor} /></Card>}
      </div>
      <aside>
        <Card padded={false} className="overflow-hidden lg:sticky lg:top-24">
          <CourseThumbnail src={course.thumbnail} alt={`${course.title} thumbnail`} className="aspect-video w-full" />
          <div className="space-y-4 p-5">
            {course.price === 0 ? <p className="text-3xl font-bold text-fg">Free</p> : <PriceTag price={course.price} discount={course.discount} size="lg" />}
            <Button fullWidth size="lg" disabled>Enroll Now (preview)</Button>
            {course.subscription && <p className="text-xs text-muted">Also available through subscription.</p>}
            <p className="text-xs text-muted">This is how students will see your course.</p>
          </div>
        </Card>
      </aside>
    </div>
  );
}
