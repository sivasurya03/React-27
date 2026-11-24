import type { ReactNode } from 'react';
import { Button } from './Button';
import { Modal } from './Overlay';

export function ConfirmDialog({ open, title, children, confirmLabel, danger, loading, onConfirm, onClose }: {
  open: boolean; title: string; children: ReactNode; confirmLabel: string; danger?: boolean; loading?: boolean; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={loading ? () => undefined : onClose} title={title} size="sm" footer={<><Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button><Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button></>}>
      <div className="text-sm text-muted">{children}</div>
    </Modal>
  );
}
