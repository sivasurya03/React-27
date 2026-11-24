import { Badge, type BadgeVariant } from '@/components/ui';
import type { CourseStatus } from '@/types';

const MAP: Record<CourseStatus, { label: string; variant: BadgeVariant }> = {
  draft: { label: 'Draft', variant: 'neutral' },
  pending: { label: 'Pending review', variant: 'warning' },
  published: { label: 'Published', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
  archived: { label: 'Archived', variant: 'info' },
};

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  const { label, variant } = MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}
