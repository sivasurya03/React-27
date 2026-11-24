import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, Clock, PlayCircle } from 'lucide-react';
import { CourseThumbnail } from '@/components/common/CourseThumbnail';
import { Badge, buttonStyles, ProgressBar } from '@/components/ui';
import type { Course, Enrollment, Lesson } from '@/types';
import { timeAgo } from '@/utils/format';
import { learnPath } from '@/utils/learning';

const STATUS = {
  completed: { label: 'Completed', variant: 'success' },
  'in-progress': { label: 'In progress', variant: 'info' },
  'not-started': { label: 'Not started', variant: 'neutral' },
} as const;

interface Props {
  course: Course;
  enrollment: Enrollment;
  instructorName: string;
  current?: Lesson;
  index?: number;
}

export function EnrolledCourseCard({ course, enrollment, instructorName, current, index = 0 }: Props) {
  const status = STATUS[enrollment.status];
  const done = enrollment.status === 'completed';
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.04 }}
      className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-pop sm:flex-row"
    >
      <CourseThumbnail src={course.thumbnail} alt="" className="aspect-video w-full sm:aspect-auto sm:w-56 sm:shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={status.variant}>{status.label}</Badge>
          <span className="text-xs text-muted">{course.category}</span>
        </div>
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-semibold text-fg">
            <Link to={`/courses/${course.id}`} className="hover:text-brand-text">{course.title}</Link>
          </h3>
          <p className="mt-0.5 truncate text-sm text-muted">{instructorName}</p>
        </div>
        <ProgressBar value={enrollment.progress} showLabel tone={done ? 'success' : 'brand'} label={`${course.title} progress`} />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0 text-sm">
            {current && !done && <p className="truncate text-fg"><span className="text-muted">{enrollment.progress === 0 ? 'Starts with: ' : 'Up next: '}</span>{current.title}</p>}
            {done && <p className="text-emerald-700 dark:text-emerald-400">Course completed</p>}
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted"><Clock className="h-3.5 w-3.5" aria-hidden />Last accessed {timeAgo(enrollment.lastAccessedAt)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {done && <Link to={`/certificates?view=${course.id}`} className={buttonStyles('primary', 'md')}><Award className="mr-2 h-4 w-4" aria-hidden />View Certificate</Link>}
            {current && (
              <Link to={learnPath(course.id, current.id)} className={buttonStyles(done ? 'outline' : 'primary', 'md')}>
                <PlayCircle className="mr-2 h-4 w-4" aria-hidden />
                {done ? 'Review Course' : enrollment.progress === 0 ? 'Start learning' : 'Continue Learning'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
