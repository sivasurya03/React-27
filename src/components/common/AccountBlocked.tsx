import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, EmptyState } from '@/components/ui';
import { logout } from '@/features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function AccountBlocked({ status }: { status: 'suspended' | 'deactivated' }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const email = useAppSelector((state) => state.admin.settings.supportEmail);
  return (
    <div className="flex min-h-screen items-center justify-center bg-app p-6">
      <Card className="max-w-md">
        <EmptyState
          icon={ShieldAlert}
          title={status === 'suspended' ? 'Your account is suspended' : 'Your account is deactivated'}
          description={`Access to this account has been disabled by an administrator. Contact ${email} if you think this is a mistake.`}
          action={<Button onClick={() => { dispatch(logout()); navigate('/login', { replace: true }); }}>Sign out</Button>}
        />
      </Card>
    </div>
  );
}
