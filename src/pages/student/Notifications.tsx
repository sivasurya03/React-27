import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Award, Bell, BellOff, BookOpen, CheckCheck, ClipboardList, Lightbulb, Megaphone, MailOpen, Mail, HelpCircle, type LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, Button, buttonStyles, Card, EmptyState, Select, Tabs } from '@/components/ui';
import { markAllAsRead, markAsRead, toggleRead } from '@/features/notifications/notificationSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectMyNotifications, selectUnreadCount } from '@/store/selectors';
import type { NotificationType } from '@/types';
import { cn } from '@/utils/cn';
import { timeAgo } from '@/utils/format';

const META: Record<NotificationType, { label: string; icon: LucideIcon; tone: string }> = {
  'course-update': { label: 'Course updates', icon: BookOpen, tone: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
  assignment: { label: 'Assignment reminders', icon: ClipboardList, tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  quiz: { label: 'Quiz results', icon: HelpCircle, tone: 'bg-violet-500/10 text-violet-700 dark:text-violet-300' },
  recommendation: { label: 'Recommendations', icon: Lightbulb, tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  certificate: { label: 'Certificates', icon: Award, tone: 'bg-rose-500/10 text-rose-700 dark:text-rose-300' },
  announcement: { label: 'Announcements', icon: Megaphone, tone: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' },
  system: { label: 'System', icon: Bell, tone: 'bg-subtle text-muted' },
};

export default function Notifications() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectMyNotifications);
  const unread = useAppSelector(selectUnreadCount);
  const [tab, setTab] = useState('all');
  const [type, setType] = useState('all');

  const rows = useMemo(
    () => items.filter((n) => (tab === 'all' || !n.read) && (type === 'all' || n.type === type)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [items, tab, type],
  );

  return (
    <>
      <PageHeader
        title="Notifications"
        description={unread ? `You have ${unread} unread ${unread === 1 ? 'notification' : 'notifications'}.` : 'You are all caught up.'}
        actions={<Button variant="outline" disabled={unread === 0} onClick={() => dispatch(markAllAsRead('student'))} leftIcon={<CheckCheck className="h-4 w-4" />}>Mark all as read</Button>}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onChange={setTab} tabs={[{ id: 'all', label: 'All', count: items.length }, { id: 'unread', label: 'Unread', count: unread }]} className="sm:min-w-64" />
        <Select aria-label="Filter by type" value={type} onChange={(e) => setType(e.target.value)} className="sm:w-60" options={[{ value: 'all', label: 'All types' }, ...Object.entries(META).map(([value, m]) => ({ value, label: m.label }))]} />
      </div>
      <Card padded={false}>
        {rows.length === 0 ? (
          <EmptyState icon={BellOff} title={tab === 'unread' ? 'No unread notifications' : 'No notifications'} description={items.length === 0 ? 'Updates about your courses will appear here.' : 'Nothing matches the current filters.'} action={<Link to="/courses" className={buttonStyles('primary')}>Browse courses</Link>} />
        ) : (
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {rows.map((n) => {
                const meta = META[n.type];
                const Icon = meta.icon;
                return (
                  <motion.li key={n.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className={cn('flex gap-3 p-4 sm:gap-4 sm:p-5', !n.read && 'bg-brand/5')}>
                    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', meta.tone)}><Icon className="h-5 w-5" aria-hidden /></span>
                    <button type="button" onClick={() => dispatch(markAsRead(n.id))} className="min-w-0 flex-1 text-left">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className={cn('text-sm text-fg', !n.read ? 'font-semibold' : 'font-medium')}>{n.title}</span>
                        {!n.read && <Badge variant="brand">New</Badge>}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted">{n.message}</span>
                      <span className="mt-1 block text-xs text-muted">{meta.label} · {timeAgo(n.createdAt)}</span>
                    </button>
                    <button type="button" onClick={() => dispatch(toggleRead(n.id))} aria-label={n.read ? `Mark "${n.title}" as unread` : `Mark "${n.title}" as read`} className="h-9 w-9 shrink-0 self-start rounded-lg text-muted transition hover:bg-subtle hover:text-fg">
                      {n.read ? <Mail className="mx-auto h-4 w-4" /> : <MailOpen className="mx-auto h-4 w-4" />}
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </Card>
    </>
  );
}
