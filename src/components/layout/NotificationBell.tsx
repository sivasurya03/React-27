import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dropdown } from '@/components/ui';
import { markAllAsRead, markAsRead } from '@/features/notifications/notificationSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectMyNotifications, selectUnreadCount } from '@/store/selectors';
import { timeAgo } from '@/utils/format';
import { cn } from '@/utils/cn';

export function NotificationBell({ canViewAll }: { canViewAll: boolean }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const items = useAppSelector(selectMyNotifications);
  const role = useAppSelector((state) => state.auth.user?.role);
  const unread = useAppSelector(selectUnreadCount);

  return (
    <Dropdown
      ariaLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'}
      widthClass="w-80"
      triggerClassName="relative flex h-10 w-10 items-center justify-center text-muted hover:bg-subtle hover:text-fg"
      trigger={() => (
        <>
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-sm font-semibold text-fg">Notifications</span>
            <button type="button" onClick={() => dispatch(markAllAsRead(role))} disabled={unread === 0} className="text-xs font-medium text-brand-text disabled:opacity-40">
              Mark all as read
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.slice(0, 6).map((n) => (
              <li key={n.id}>
                <button type="button" onClick={() => dispatch(markAsRead(n.id))} className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-subtle">
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-brand')} aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-fg">{n.title}</span>
                    <span className="line-clamp-2 text-xs text-muted">{n.message}</span>
                    <span className="mt-1 block text-[11px] text-muted">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {canViewAll && (
            <button
              type="button"
              onClick={() => {
                close();
                navigate('/notifications');
              }}
              className="w-full border-t border-line px-4 py-3 text-center text-sm font-medium text-brand-text hover:bg-subtle"
            >
              View all notifications
            </button>
          )}
        </div>
      )}
    </Dropdown>
  );
}
