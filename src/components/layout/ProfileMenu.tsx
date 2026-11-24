import { ChevronDown, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Dropdown, DropdownItem } from '@/components/ui';
import { logout } from '@/features/auth/authSlice';
import { useAppDispatch } from '@/store/hooks';
import type { User } from '@/types';
import { ROLE_LABEL } from './navConfig';

const PROFILE_PATH = { student: '/profile', instructor: '/instructor/profile', admin: '/admin/settings' } as const;
const SETTINGS_PATH = { student: '/profile', instructor: '/instructor/settings', admin: '/admin/settings' } as const;

export function ProfileMenu({ user }: { user: User }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const go = (path: string, close: () => void) => () => {
    close();
    navigate(path);
  };

  return (
    <Dropdown
      ariaLabel="Open profile menu"
      widthClass="w-60"
      triggerClassName="flex items-center gap-2 p-1 pr-2 hover:bg-subtle"
      trigger={() => (
        <>
          <Avatar name={user.name} src={user.avatar} size="sm" />
          <span className="hidden max-w-32 truncate text-sm font-medium text-fg md:block">{user.name}</span>
          <ChevronDown className="hidden h-4 w-4 text-muted md:block" aria-hidden />
        </>
      )}
    >
      {(close) => (
        <div>
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold text-fg">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <p className="mt-1 text-xs font-medium text-brand-text">{ROLE_LABEL[user.role]}</p>
          </div>
          <DropdownItem icon={<UserIcon className="h-4 w-4" />} onClick={go(PROFILE_PATH[user.role], close)}>
            Profile
          </DropdownItem>
          <DropdownItem icon={<Settings className="h-4 w-4" />} onClick={go(SETTINGS_PATH[user.role], close)}>
            Settings
          </DropdownItem>
          <DropdownItem
            danger
            icon={<LogOut className="h-4 w-4" />}
            onClick={() => {
              close();
              dispatch(logout());
              navigate('/login', { replace: true });
            }}
          >
            Log out
          </DropdownItem>
        </div>
      )}
    </Dropdown>
  );
}
