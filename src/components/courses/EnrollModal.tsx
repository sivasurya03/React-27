import { CheckCircle2 } from 'lucide-react';
import { CourseThumbnail } from '@/components/common/CourseThumbnail';
import { Button, Modal } from '@/components/ui';
import type { Course } from '@/types';
import { formatCurrency, netPrice } from '@/utils/format';

interface Props {
  course: Course;
  instructorName: string;
  open: boolean;
  loading: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function EnrollModal({ course, instructorName, open, loading, error, onClose, onConfirm }: Props) {
  const total = netPrice(course.price, course.discount);
  const saved = Math.round((course.price - total) * 100) / 100;
  return (
    <Modal
      open={open}
      onClose={loading ? () => undefined : onClose}
      title="Confirm enrollment"
      description="Review your order. This is a demo, so no payment is taken."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={onConfirm} loading={loading} leftIcon={<CheckCircle2 className="h-4 w-4" />}>Confirm Enrollment</Button>
        </>
      }
    >
      <div className="flex gap-4">
        <CourseThumbnail src={course.thumbnail} alt="" className="aspect-video w-28 shrink-0 rounded-xl sm:w-36" />
        <div className="min-w-0">
          <p className="font-semibold leading-snug text-fg">{course.title}</p>
          <p className="mt-1 text-sm text-muted">by {instructorName}</p>
        </div>
      </div>
      <dl className="mt-5 space-y-2.5 rounded-xl bg-subtle p-4 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Original price</dt><dd className="text-fg">{formatCurrency(course.price)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Discount ({course.discount}%)</dt><dd className="text-emerald-700 dark:text-emerald-400">{saved > 0 ? `-${formatCurrency(saved)}` : formatCurrency(0)}</dd></div>
        <div className="flex justify-between border-t border-line pt-2.5 text-base font-semibold"><dt className="text-fg">Total</dt><dd className="text-fg">{formatCurrency(total)}</dd></div>
      </dl>
      {error && <p role="alert" className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>}
    </Modal>
  );
}
