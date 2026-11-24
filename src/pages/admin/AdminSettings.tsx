import { useState, type FormEvent } from 'react';
import { Lock, Moon, Sun } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card, CardHeader, ConfirmDialog, Input, Select, Switch, useToast } from '@/components/ui';
import { saveAdminSettings } from '@/features/admin/adminSlice';
import { changePassword } from '@/features/auth/authSlice';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { AdminSettings as Settings } from '@/types';
import { validateEmail, validatePassword, type FieldErrors } from '@/utils/validators';

const TIMEZONES = ['Asia/Kolkata', 'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Singapore', 'Australia/Sydney'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'SGD'];
const NOTIFICATIONS: { key: keyof Settings['notifications']; label: string; description: string }[] = [
  { key: 'newStudent', label: 'New student registrations', description: 'When someone joins as a student' },
  { key: 'newInstructor', label: 'New instructor registrations', description: 'When an instructor asks for approval' },
  { key: 'courseSubmitted', label: 'Courses submitted for review', description: 'When an instructor submits a course' },
  { key: 'enrollment', label: 'Enrollments', description: 'When a student enrols in a course' },
  { key: 'revenue', label: 'Revenue and refunds', description: 'Payments and refund requests' },
  { key: 'system', label: 'System alerts', description: 'Backups, errors and maintenance' },
];

export default function AdminSettings() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { mode, setMode } = useTheme();
  const stored = useAppSelector((s) => s.admin.settings);
  const [form, setForm] = useState<Settings>(stored);
  const [errors, setErrors] = useState<FieldErrors<'platformName' | 'supportEmail'>>({});
  const [saving, setSaving] = useState(false);
  const [confirmMaintenance, setConfirmMaintenance] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState<FieldErrors<'current' | 'next' | 'confirm'>>({});
  const [pwSaving, setPwSaving] = useState(false);

  const dirty = JSON.stringify(form) !== JSON.stringify(stored);
  const patch = (changes: Partial<Settings>): void => setForm((f) => ({ ...f, ...changes }));

  const save = async (): Promise<void> => {
    const found: typeof errors = {};
    if (form.platformName.trim().length < 2) found.platformName = 'Enter a platform name of at least 2 characters.';
    const email = validateEmail(form.supportEmail);
    if (email) found.supportEmail = email;
    setErrors(found);
    if (Object.keys(found).length > 0) { toast.error('Please fix the highlighted fields'); return; }
    setSaving(true);
    const result = await dispatch(saveAdminSettings({ ...form, platformName: form.platformName.trim(), supportEmail: form.supportEmail.trim() }));
    setSaving(false);
    if (saveAdminSettings.fulfilled.match(result)) toast.success('Settings saved'); else toast.error('Could not save settings', result.payload);
  };

  const onPassword = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const found: typeof pwErrors = {};
    if (!pw.current) found.current = 'Enter your current password.';
    const strength = validatePassword(pw.next);
    if (strength) found.next = strength;
    if (pw.confirm !== pw.next) found.confirm = 'Passwords do not match.';
    setPwErrors(found);
    if (Object.keys(found).length > 0) return;
    setPwSaving(true);
    const result = await dispatch(changePassword({ current: pw.current, next: pw.next }));
    setPwSaving(false);
    if (changePassword.fulfilled.match(result)) { setPw({ current: '', next: '', confirm: '' }); toast.success('Password updated', result.payload.persisted ? undefined : 'Demo accounts keep their original password.'); }
    else setPwErrors({ current: result.payload ?? 'Could not update your password.' });
  };

  return (
    <>
      <PageHeader title="Settings" description="Platform configuration, notifications and security." actions={<Button loading={saving} disabled={!dirty} onClick={() => void save()}>Save changes</Button>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="General" subtitle="How the platform presents itself" />
          <div className="grid gap-4">
            <Input label="Platform name" value={form.platformName} onChange={(e) => patch({ platformName: e.target.value })} error={errors.platformName} />
            <Input label="Support email" type="email" value={form.supportEmail} onChange={(e) => patch({ supportEmail: e.target.value })} error={errors.supportEmail} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Timezone" value={form.timezone} onChange={(e) => patch({ timezone: e.target.value })} options={TIMEZONES.map((t) => ({ value: t, label: t }))} />
              <Select label="Currency" value={form.currency} onChange={(e) => patch({ currency: e.target.value })} options={CURRENCIES.map((c) => ({ value: c, label: c }))} hint="Display currency (amounts are shown in USD in this demo)." />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Platform controls" subtitle="Rules that affect every user" />
          <div className="space-y-4">
            <Switch checked={form.allowRegistrations} onChange={(allowRegistrations) => patch({ allowRegistrations })} label="Allow new registrations" description="When off, the sign-up form rejects new students." />
            <Switch checked={form.instructorApprovals} onChange={(instructorApprovals) => patch({ instructorApprovals })} label="Require instructor approval" description="New instructors wait for an administrator to approve them." />
            <Switch checked={form.courseApprovals} onChange={(courseApprovals) => patch({ courseApprovals })} label="Require course approval" description="Courses go to review instead of publishing immediately." />
            <Switch checked={form.maintenanceMode} onChange={(on) => (on ? setConfirmMaintenance(true) : patch({ maintenanceMode: false }))} label="Maintenance mode" description="Only administrators can sign in while this is on." />
          </div>
        </Card>

        <Card>
          <CardHeader title="Notifications" subtitle="What you hear about" />
          <div className="space-y-4">{NOTIFICATIONS.map((n) => <Switch key={n.key} checked={form.notifications[n.key]} onChange={(v) => patch({ notifications: { ...form.notifications, [n.key]: v } })} label={n.label} description={n.description} />)}</div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Appearance" />
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Theme">
              <Button role="radio" aria-checked={mode === 'light'} variant={mode === 'light' ? 'primary' : 'outline'} onClick={() => setMode('light')} leftIcon={<Sun className="h-4 w-4" />}>Light</Button>
              <Button role="radio" aria-checked={mode === 'dark'} variant={mode === 'dark' ? 'primary' : 'outline'} onClick={() => setMode('dark')} leftIcon={<Moon className="h-4 w-4" />}>Dark</Button>
            </div>
            <p className="mt-2 text-xs text-muted">The theme applies immediately and is remembered on this device.</p>
          </Card>
          <Card>
            <CardHeader title="Security" subtitle="Sessions and your password" />
            <div className="space-y-4">
              <Select label="Session timeout" value={form.sessionTimeout} onChange={(e) => patch({ sessionTimeout: e.target.value as Settings['sessionTimeout'] })} options={[{ value: '30', label: '30 minutes' }, { value: '60', label: '1 hour' }, { value: '240', label: '4 hours' }, { value: 'never', label: 'Never' }]} hint="Stored as a platform policy; sessions are not auto-expired in this demo." />
              <Switch checked={form.strongPasswords} onChange={(strongPasswords) => patch({ strongPasswords })} label="Require strong passwords" description="Minimum 8 characters with a letter and a number." />
              <form onSubmit={(e) => void onPassword(e)} noValidate className="space-y-3 border-t border-line pt-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-fg"><Lock className="h-4 w-4" aria-hidden />Change password</h3>
                <Input label="Current password" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} error={pwErrors.current} />
                <Input label="New password" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} error={pwErrors.next} />
                <Input label="Confirm new password" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} error={pwErrors.confirm} />
                <Button type="submit" variant="outline" loading={pwSaving}>Update password</Button>
              </form>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog open={confirmMaintenance} title="Turn on maintenance mode?" confirmLabel="Turn on" danger onConfirm={() => { patch({ maintenanceMode: true }); setConfirmMaintenance(false); }} onClose={() => setConfirmMaintenance(false)}>
        New student and instructor sign-ins will be blocked until you turn it off. Remember to save your changes.
      </ConfirmDialog>
    </>
  );
}
