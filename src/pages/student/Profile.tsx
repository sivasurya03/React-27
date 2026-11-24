import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Award, BookOpen, CheckCircle2, Clock, Flame, Moon, Sun, Upload } from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar, Button, Card, CardHeader, Checkbox, Input, Skeleton, Textarea, useToast } from '@/components/ui';
import { updateProfile } from '@/features/auth/authSlice';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser, selectMyEnrollments } from '@/store/selectors';
import type { UserPreferences } from '@/types';
import { formatDate } from '@/utils/format';
import { fileToAvatar } from '@/utils/image';
import { staggerChildren } from '@/utils/motion';
import { validateProfile, type FieldErrors } from '@/utils/validators';

const DEFAULT_PREFS: UserPreferences = { emailNotifications: true, courseUpdates: true, weeklyDigest: false };
type Errors = FieldErrors<'name' | 'email' | 'phone' | 'location' | 'bio'>;

export default function Profile() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { mode, setMode } = useTheme();
  const user = useAppSelector(selectCurrentUser);
  const students = useAppSelector((state) => state.students);
  const enrollments = useAppSelector(selectMyEnrollments);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(() => ({ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '', location: user?.location ?? '', bio: user?.bio ?? '' }));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  if (!user) return null;
  const stats = students.items.find((s) => s.id === user.id);
  const completed = enrollments.filter((e) => e.status === 'completed').length;
  const prefs = user.preferences ?? DEFAULT_PREFS;
  const dirty = form.name !== user.name || form.email !== user.email || form.phone !== (user.phone ?? '') || form.location !== (user.location ?? '') || form.bio !== (user.bio ?? '');
  const set = (key: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: event.target.value }));

  const onSubmit = (event: FormEvent): void => {
    event.preventDefault();
    const found = validateProfile(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    window.setTimeout(() => {
      dispatch(updateProfile({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), location: form.location.trim(), bio: form.bio.trim() }));
      setSaving(false);
      toast.success('Profile updated', 'Your changes have been saved.');
    }, 400);
  };

  const onPhoto = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      dispatch(updateProfile({ avatar: await fileToAvatar(file) }));
      toast.success('Photo updated');
    } catch (error) {
      toast.error('Could not use that image', error instanceof Error ? error.message : undefined);
    }
  };

  const setPref = (key: keyof UserPreferences) => (event: ChangeEvent<HTMLInputElement>): void => {
    dispatch(updateProfile({ preferences: { ...prefs, [key]: event.target.checked } }));
    toast.success('Preferences saved');
  };

  return (
    <>
      <PageHeader title="Profile" description={`Member since ${formatDate(user.createdAt)}`} />

      {students.status !== 'succeeded' ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      ) : (
        <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <StatCard label="Courses enrolled" value={String(enrollments.length)} icon={BookOpen} />
          <StatCard label="Completed" value={String(completed)} icon={CheckCircle2} />
          <StatCard label="Learning hours" value={String(stats?.learningHours ?? 0)} icon={Clock} />
          <StatCard label="Day streak" value={String(stats?.streak ?? 0)} icon={Flame} />
          <StatCard label="Certificates" value={String(completed)} icon={Award} />
        </motion.div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Personal information" subtitle="Update how you appear across LearnSphere" />
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <Avatar name={user.name} src={user.avatar} size="xl" />
            <div className="space-y-2">
              <input ref={fileRef} type="file" accept="image/*" className="sr-only" aria-label="Upload profile photo" onChange={(e) => void onPhoto(e)} />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" leftIcon={<Upload className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>Upload photo</Button>
                {user.avatar && <Button size="sm" variant="ghost" onClick={() => { dispatch(updateProfile({ avatar: '' })); toast.info('Photo removed'); }}>Remove</Button>}
              </div>
              <p className="text-xs text-muted">JPG or PNG, up to 3 MB.</p>
            </div>
          </div>
          <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
            <Input label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
            <Input label="Phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="+91 98765 43210" />
            <Input label="Location" value={form.location} onChange={set('location')} error={errors.location} placeholder="City, Country" />
            <div className="sm:col-span-2"><Textarea label="Bio" rows={4} value={form.bio} onChange={set('bio')} error={errors.bio} hint={`${form.bio.length}/240 characters`} /></div>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button type="submit" loading={saving} disabled={!dirty}>Save changes</Button>
              <Button type="button" variant="outline" disabled={!dirty || saving} onClick={() => { setForm({ name: user.name, email: user.email, phone: user.phone ?? '', location: user.location ?? '', bio: user.bio ?? '' }); setErrors({}); }}>Discard</Button>
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Appearance" subtitle="Choose how LearnSphere looks" />
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Theme preference">
              <Button role="radio" aria-checked={mode === 'light'} variant={mode === 'light' ? 'primary' : 'outline'} onClick={() => setMode('light')} leftIcon={<Sun className="h-4 w-4" />}>Light</Button>
              <Button role="radio" aria-checked={mode === 'dark'} variant={mode === 'dark' ? 'primary' : 'outline'} onClick={() => setMode('dark')} leftIcon={<Moon className="h-4 w-4" />}>Dark</Button>
            </div>
          </Card>
          <Card>
            <CardHeader title="Notification preferences" />
            <div className="space-y-3">
              <Checkbox label="Email me about my account" checked={prefs.emailNotifications} onChange={setPref('emailNotifications')} />
              <Checkbox label="Course updates and announcements" checked={prefs.courseUpdates} onChange={setPref('courseUpdates')} />
              <Checkbox label="Weekly learning digest" checked={prefs.weeklyDigest} onChange={setPref('weeklyDigest')} />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
