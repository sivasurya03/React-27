import { useState, type FormEvent } from 'react';
import { Lock, Moon, Sun } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card, CardHeader, Input, Select, Switch, useToast } from '@/components/ui';
import { changePassword, updateProfile } from '@/features/auth/authSlice';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/selectors';
import type { InstructorSettings as Settings } from '@/types';
import { settingsOf } from '@/utils/instructorSettings';
import { validatePassword, type FieldErrors } from '@/utils/validators';

const NOTIFICATIONS: { key: keyof Settings['notifications']; label: string; description: string }[] = [
  { key: 'enrollment', label: 'New enrollments', description: 'When a student enrols in one of your courses' },
  { key: 'assignment', label: 'Assignment submissions', description: 'When a student submits an assignment' },
  { key: 'review', label: 'Reviews', description: 'When a student reviews a course' },
  { key: 'payment', label: 'Payments', description: 'Payout and transaction updates' },
  { key: 'platform', label: 'Platform updates', description: 'News and product announcements' },
];

export default function InstructorSettings() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { mode, setMode } = useTheme();
  const user = useAppSelector(selectCurrentUser);
  const settings = settingsOf(user);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState<FieldErrors<'current' | 'next' | 'confirm'>>({});
  const [saving, setSaving] = useState(false);

  if (!user) return null;
  const save = (next: Settings): void => {
    dispatch(updateProfile({ instructorSettings: next }));
    toast.success('Settings saved');
  };

  const onPassword = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const found: typeof errors = {};
    if (!pw.current) found.current = 'Enter your current password.';
    const strength = validatePassword(pw.next);
    if (strength) found.next = strength;
    if (pw.confirm !== pw.next) found.confirm = 'Passwords do not match.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    const result = await dispatch(changePassword({ current: pw.current, next: pw.next }));
    setSaving(false);
    if (changePassword.fulfilled.match(result)) {
      setPw({ current: '', next: '', confirm: '' });
      toast.success('Password updated', result.payload.persisted ? undefined : 'Demo accounts keep their original password.');
    } else {
      setErrors({ current: result.payload ?? 'Could not update your password.' });
    }
  };

  return (
    <>
      <PageHeader title="Settings" description="Manage your account, notifications and preferences." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Account" subtitle="Sign-in details and visibility" />
          <div className="space-y-5">
            <Input label="Email" type="email" value={user.email} readOnly hint="Change your email from the Profile page." />
            <Switch checked={settings.profileVisible} onChange={(profileVisible) => save({ ...settings, profileVisible })} label="Public instructor profile" description="Show your profile on your course pages" />
            <form onSubmit={(e) => void onPassword(e)} noValidate className="space-y-3 border-t border-line pt-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-fg"><Lock className="h-4 w-4" aria-hidden />Change password</h3>
              <Input label="Current password" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} error={errors.current} />
              <Input label="New password" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} error={errors.next} hint="At least 8 characters with a letter and a number." />
              <Input label="Confirm new password" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} error={errors.confirm} />
              <Button type="submit" loading={saving}>Update password</Button>
            </form>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Notifications" subtitle="Choose what you hear about" />
            <div className="space-y-4">
              {NOTIFICATIONS.map((n) => <Switch key={n.key} checked={settings.notifications[n.key]} onChange={(value) => save({ ...settings, notifications: { ...settings.notifications, [n.key]: value } })} label={n.label} description={n.description} />)}
            </div>
          </Card>
          <Card>
            <CardHeader title="Appearance" />
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Theme">
              <Button role="radio" aria-checked={mode === 'light'} variant={mode === 'light' ? 'primary' : 'outline'} onClick={() => setMode('light')} leftIcon={<Sun className="h-4 w-4" />}>Light</Button>
              <Button role="radio" aria-checked={mode === 'dark'} variant={mode === 'dark' ? 'primary' : 'outline'} onClick={() => setMode('dark')} leftIcon={<Moon className="h-4 w-4" />}>Dark</Button>
            </div>
          </Card>
          <Card>
            <CardHeader title="Preferences" />
            <div className="space-y-4">
              <Select label="Default course visibility" value={settings.defaultVisibility} onChange={(e) => save({ ...settings, defaultVisibility: e.target.value as Settings['defaultVisibility'] })} options={[{ value: 'draft', label: 'Draft (private until I publish)' }, { value: 'published', label: 'Published (visible immediately)' }]} />
              <Select label="Email preferences" value={settings.emailPreferences} onChange={(e) => save({ ...settings, emailPreferences: e.target.value as Settings['emailPreferences'] })} options={[{ value: 'all', label: 'All emails' }, { value: 'important', label: 'Important only' }, { value: 'none', label: 'No emails' }]} />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
