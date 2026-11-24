import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Trash2, Users } from 'lucide-react';
import { CourseThumbnail } from '@/components/common/CourseThumbnail';
import { Badge, Button, buttonStyles } from '@/components/ui';
import type { Course } from '@/types';
import { formatCompact } from '@/utils/format';
import { PriceTag } from './PriceTag';
import { Rating } from './Rating';
import { WishlistButton } from './WishlistButton';

interface CourseCardProps {
  course: Course;
  instructorName: string;
  reviewCount: number;
  index?: number;
  onRemove?: () => void;
}

export function CourseCard({ course, instructorName, reviewCount, index = 0, onRemove }: CourseCardProps) {
  const href = `/courses/${course.id}`;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.04 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-pop"
    >
      <div className="relative">
        <Link to={href} tabIndex={-1} aria-hidden>
          <CourseThumbnail src={course.thumbnail} alt="" className="aspect-video w-full transition duration-300 group-hover:scale-[1.03]" />
        </Link>
        {course.discount > 0 && <Badge variant="success" className="absolute left-3 top-3 bg-surface/95 shadow-sm">{course.discount}% off</Badge>}
        <WishlistButton courseId={course.id} courseTitle={course.title} className="absolute right-3 top-3 h-9 w-9 rounded-full bg-surface/95 shadow-sm hover:bg-surface" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="brand">{course.category}</Badge>
          <span className="text-xs font-medium text-muted">{course.level}</span>
        </div>
        <div>
          <h3 className="line-clamp-2 font-semibold leading-snug text-fg">
            <Link to={href} className="transition hover:text-brand-text focus-visible:text-brand-text">{course.title}</Link>
          </h3>
          <p className="mt-1 truncate text-sm text-muted">{instructorName}</p>
        </div>
        <Rating value={course.rating} count={reviewCount} />
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <li className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden />{course.duration}h</li>
          <li className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" aria-hidden />{course.lessonsCount} lessons</li>
          <li className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" aria-hidden />{formatCompact(course.studentsCount)} students</li>
        </ul>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <PriceTag price={course.price} discount={course.discount} />
          <div className="flex shrink-0 gap-2">
            {onRemove && (
              <Button size="sm" variant="outline" onClick={onRemove} aria-label={`Remove ${course.title} from wishlist`} leftIcon={<Trash2 className="h-4 w-4" />}>Remove</Button>
            )}
            <Link to={href} className={buttonStyles('primary', 'sm')}>View Course</Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
