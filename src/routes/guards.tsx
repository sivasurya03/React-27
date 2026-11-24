import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { AccountBlocked } from '@/components/common/AccountBlocked';
import { selectAccountStatus, selectCurrentUser } from '@/store/selectors';
import type { Role } from '@/types';
import { homeFor } from '@/utils/paths';

/** Redirects signed-in users away from public auth pages. */
export function GuestRoute() {
  const user = useAppSelector(selectCurrentUser);
  return user ? <Navigate to={homeFor(user.role)} replace /> : <Outlet />;
}

/** Requires a session; when `allow` is given, also requires one of those roles. */
export function RoleRoute({ allow }: { allow?: Role[] }) {
  const user = useAppSelector(selectCurrentUser);
  const location = useLocation();
  const accountStatus = useAppSelector(selectAccountStatus);
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (accountStatus === 'suspended' || accountStatus === 'deactivated') return <AccountBlocked status={accountStatus} />;
  if (allow && !allow.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return <Outlet />;
}

export const ProtectedRoute = () => <RoleRoute />;
