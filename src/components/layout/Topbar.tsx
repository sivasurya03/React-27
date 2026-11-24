import { useState } from 'react';
import { Menu, PanelLeft, Search } from 'lucide-react';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Logo } from '@/components/common/Logo';
import type { User } from '@/types';
import { GlobalSearch } from './GlobalSearch';
import { NotificationBell } from './NotificationBell';
import { ProfileMenu } from './ProfileMenu';

interface TopbarProps {
  user: User;
  onOpenDrawer: () => void;
  onToggleSidebar: () => void;
}

export function Topbar({ user, onOpenDrawer, onToggleSidebar }: TopbarProps) {
  const [mobileSearch, setMobileSearch] = useState(false);
  const iconButton = 'flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:bg-subtle hover:text-fg';

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
      <div className="flex h-16 items-center gap-2 px-3 sm:px-6">
        <button type="button" aria-label="Open navigation menu" onClick={onOpenDrawer} className={`${iconButton} lg:hidden`}>
          <Menu className="h-5 w-5" />
        </button>
        <button type="button" aria-label="Toggle sidebar" onClick={onToggleSidebar} className={`${iconButton} hidden lg:flex`}>
          <PanelLeft className="h-5 w-5" />
        </button>
        <Logo collapsed className="sm:hidden" />
        <div className="mx-2 hidden max-w-xl flex-1 sm:block">
          <GlobalSearch />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" aria-label="Search" onClick={() => setMobileSearch((v) => !v)} className={`${iconButton} sm:hidden`}>
            <Search className="h-5 w-5" />
          </button>
          <ThemeToggle />
          <NotificationBell canViewAll={user.role === 'student'} />
          <ProfileMenu user={user} />
        </div>
      </div>
      {mobileSearch && (
        <div className="px-3 pb-3 sm:hidden">
          <GlobalSearch autoFocus onDone={() => setMobileSearch(false)} />
        </div>
      )}
    </header>
  );
}
