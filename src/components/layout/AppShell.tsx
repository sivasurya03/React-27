import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageSkeleton } from '@/components/common/PageSkeleton';
import { Breadcrumb, Drawer, type Crumb } from '@/components/ui';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentUser, selectUnreadCount, selectWishlistCount } from '@/store/selectors';
import { cn } from '@/utils/cn';
import { homeFor } from '@/utils/paths';
import { pageTransition } from '@/utils/motion';
import { Logo } from '@/components/common/Logo';
import { NAV } from './navConfig';
import { Sidebar, SidebarNav } from './Sidebar';
import { Topbar } from './Topbar';

const titleCase = (segment: string): string =>
  /\d/.test(segment) ? 'Details' : segment.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

export function AppShell({ children }: { children?: ReactNode }) {
  const user = useAppSelector(selectCurrentUser);
  const unread = useAppSelector(selectUnreadCount);
  const wishlisted = useAppSelector(selectWishlistCount);
  const maintenance = useAppSelector((state) => state.admin.settings.maintenanceMode);
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const crumbs = useMemo<Crumb[]>(() => {
    if (!user || pathname.startsWith('/learn')) return [];
    const home = homeFor(user.role);
    const segments = pathname.split('/').filter(Boolean);
    if (user.role !== 'student') segments.shift();
    let trail = user.role === 'student' ? '' : `/${user.role}`;
    return [
      { label: 'Home', to: home },
      ...segments.map((segment) => {
        trail += `/${segment}`;
        return { label: titleCase(segment), to: trail };
      }),
    ];
  }, [pathname, user]);

  if (!user) return null;
  const items = NAV[user.role];
  const badges = user.role === 'student' ? { '/notifications': unread, '/wishlist': wishlisted } : undefined;

  return (
    <div className="min-h-screen bg-app">
      <a href="#main" className="sr-only z-50 rounded-lg bg-brand px-4 py-2 text-brand-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <Sidebar items={items} collapsed={collapsed} badges={badges} label={user.role === 'admin' ? 'Admin' : undefined} />
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Navigation" side="left">
        <div className="px-5 pt-4"><Logo /></div>
        <SidebarNav items={items} badges={badges} onNavigate={() => setDrawerOpen(false)} />
      </Drawer>
      <div className={cn('transition-[padding] duration-300', collapsed ? 'lg:pl-20' : 'lg:pl-64')}>
        <Topbar user={user} onOpenDrawer={() => setDrawerOpen(true)} onToggleSidebar={() => setCollapsed((v) => !v)} />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {maintenance && user.role === 'admin' && <p role="status" className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">Maintenance mode is on: only administrators can sign in.</p>}
          <Breadcrumb items={crumbs} />
          <motion.div key={pathname} {...pageTransition}>
            <Suspense fallback={<PageSkeleton />}>{children ?? <Outlet />}</Suspense>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
