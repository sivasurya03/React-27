import { useMemo, useState } from 'react';
import { Avatar, Button, EmptyState } from '@/components/ui';
import { MessageSquare } from 'lucide-react';
import type { Review, Student } from '@/types';
import { formatDate } from '@/utils/format';
import { Rating } from './Rating';

export function ReviewsSection({ reviews, students, average }: { reviews: Review[]; students: Student[]; average: number }) {
  const [showAll, setShowAll] = useState(false);
  const names = useMemo(() => new Map(students.map((s) => [s.id, s.name])), [students]);
  const distribution = useMemo(() => [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length })), [reviews]);
  const sorted = useMemo(() => [...reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [reviews]);
  const visible = showAll ? sorted : sorted.slice(0, 3);

  if (reviews.length === 0) {
    return <EmptyState icon={MessageSquare} title="No reviews yet" description="Be the first to share your experience after you enrol." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-[10rem_1fr] sm:items-center">
        <div className="text-center sm:text-left">
          <p className="text-5xl font-bold tracking-tight text-fg">{average.toFixed(1)}</p>
          <Rating value={average} className="mt-1" />
          <p className="mt-1 text-sm text-muted">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
        </div>
        <ul className="space-y-2" aria-label="Rating distribution">
          {distribution.map(({ star, count }) => (
            <li key={star} className="flex items-center gap-3 text-sm">
              <span className="w-10 shrink-0 text-muted">{star} star</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-subtle">
                <div className="h-full rounded-full bg-amber-400" style={{ width: `${(count / reviews.length) * 100}%` }} />
              </div>
              <span className="w-6 text-right tabular-nums text-muted">{count}</span>
            </li>
          ))}
        </ul>
      </div>
      <ul className="divide-y divide-line">
        {visible.map((review) => {
          const name = names.get(review.studentId) ?? 'Learner';
          return (
            <li key={review.id} className="flex gap-3 py-4">
              <Avatar name={name} size="md" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-medium text-fg">{name}</span>
                  <Rating value={review.rating} />
                  <span className="text-xs text-muted">{formatDate(review.createdAt)}</span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{review.comment}</p>
              </div>
            </li>
          );
        })}
      </ul>
      {sorted.length > 3 && (
        <Button variant="outline" onClick={() => setShowAll((v) => !v)}>{showAll ? 'Show fewer reviews' : `Show all ${sorted.length} reviews`}</Button>
      )}
    </div>
  );
}
