import { Badge, type BadgeVariant } from '@/components/ui';
import type { CompletionState, PaymentState } from '@/utils/adminInsights';
import { completionLabel, paymentLabel } from '@/utils/adminInsights';

const ACCOUNT: Record<string, { label: string; variant: BadgeVariant }> = {
  active: { label: 'Active', variant: 'success' },
  suspended: { label: 'Suspended', variant: 'danger' },
  deactivated: { label: 'Deactivated', variant: 'neutral' },
  pending: { label: 'Pending approval', variant: 'warning' },
};

export function AccountStatusBadge({ status = 'active' }: { status?: string }) {
  const { label, variant } = ACCOUNT[status] ?? ACCOUNT.active;
  return <Badge variant={variant}>{label}</Badge>;
}

const PAYMENT: Record<PaymentState, BadgeVariant> = { paid: 'success', pending: 'warning', refunded: 'info', failed: 'danger' };
const COMPLETION: Record<CompletionState, BadgeVariant> = { active: 'info', completed: 'success', cancelled: 'neutral', refunded: 'danger' };

export const PaymentBadge = ({ status }: { status: PaymentState }) => <Badge variant={PAYMENT[status]}>{paymentLabel(status)}</Badge>;
export const CompletionBadge = ({ status }: { status: CompletionState }) => <Badge variant={COMPLETION[status]}>{completionLabel(status)}</Badge>;
