import { BookOpen, Star, Users } from 'lucide-react';
import { Avatar } from '@/components/ui';
import type { Instructor } from '@/types';
import { formatCompact } from '@/utils/format';

export function InstructorCard({ instructor }: { instructor: Instructor }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <Avatar name={instructor.name} src={instructor.avatar} size="xl" />
      <div className="min-w-0">
        <h3 className="text-lg font-semibold text-fg">{instructor.name}</h3>
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
          <li className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />{instructor.rating.toFixed(1)} instructor rating</li>
          <li className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" aria-hidden />{formatCompact(instructor.studentsCount)} students</li>
          <li className="inline-flex items-center gap-1.5"><BookOpen className="h-4 w-4" aria-hidden />{instructor.coursesCount} courses</li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-muted">{instructor.bio}</p>
      </div>
    </div>
  );
}
