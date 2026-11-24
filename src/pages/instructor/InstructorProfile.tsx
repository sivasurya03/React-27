import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Globe, Github, Linkedin, MapPin, Pencil, Twitter, Upload } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar, Badge, Button, Card, CardHeader, Input, Textarea, useToast } from '@/components/ui';
import { updateProfile } from '@/features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/selectors';
import type { User } from '@/types';
import { fileToAvatar } from '@/utils/image';
import { isUrl } from '@/utils/instructorSettings';
import { validateProfile, type FieldErrors } from '@/utils/validators';

type Errors = FieldErrors<'name' | 'email' | 'phone' | 'location' | 'bio' | 'website' | 'twitter' | 'linkedin' | 'github'>;

const toForm = (u: User) => ({
  name: u.name, email: u.email, phone: u.phone ?? '', location: u.location ?? '', bio: u.bio ?? '', website: u.website ?? '',
  expertise: (u.expertise ?? []).join(', '), twitter: u.social?.twitter ?? '', linkedin: u.social?.linkedin ?? '', github: u.social?.github ?? '',
});

export default function InstructorProfile() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const user = useAppSelector(selectCurrentUser);
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [form, setForm] = useState(() => (user ? toForm(user) : null));

  if (!user || !form) return null;
  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => (f ? { ...f, [key]: e.target.value } : f));
  const readOnly = !editing;

  const validate = (): Errors => {
    const found: Errors = { ...validateProfile(form) };
    if (form.website && !isUrl(form.website)) found.website = 'Enter a full URL starting with https://';
    (['twitter', 'linkedin', 'github'] as const).forEach((k) => { if (form[k] && !isUrl(form[k])) found[k] = 'Enter a full URL starting with https://'; });
    return found;
  };

  const onSubmit = (event: FormEvent): void => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) { toast.error('Please fix the highlighted fields'); return; }
    setSaving(true);
    window.setTimeout(() => {
      dispatch(updateProfile({
        name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), location: form.location.trim(), bio: form.bio.trim(), website: form.website.trim(),
        expertise: form.expertise.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10),
        social: { twitter: form.twitter.trim(), linkedin: form.linkedin.trim(), github: form.github.trim() },
      }));
      setSaving(false);
      setEditing(false);
      toast.success('Profile saved');
    }, 400);
  };

  const cancel = (): void => { setForm(toForm(user)); setErrors({}); setEditing(false); };
  const onPhoto = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try { dispatch(updateProfile({ avatar: await fileToAvatar(file) })); toast.success('Photo updated'); }
    catch (error) { toast.error('Could not use that image', error instanceof Error ? error.message : undefined); }
  };

  const tags = (user.expertise ?? []);
  return (
    <>
      <PageHeader title="Profile" description="How students see you." actions={!editing ? <Button leftIcon={<Pencil className="h-4 w-4" />} onClick={() => setEditing(true)}>Edit profile</Button> : undefined} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="text-center">
          <Avatar name={user.name} src={user.avatar} size="xl" className="mx-auto" />
          <h2 className="mt-4 text-lg font-semibold text-fg">{user.name}</h2>
          <p className="text-sm text-muted">{user.email}</p>
          {user.location && <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted"><MapPin className="h-4 w-4" aria-hidden />{user.location}</p>}
          {tags.length > 0 && <div className="mt-4 flex flex-wrap justify-center gap-1.5">{tags.map((t) => <Badge key={t} variant="brand">{t}</Badge>)}</div>}
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" aria-label="Upload profile photo" onChange={(e) => void onPhoto(e)} />
          {editing && <Button className="mt-5" size="sm" variant="outline" leftIcon={<Upload className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>Change photo</Button>}
          <div className="mt-5 flex justify-center gap-3 text-muted">
            {user.website && <a href={user.website} target="_blank" rel="noreferrer" aria-label="Website" className="hover:text-fg"><Globe className="h-5 w-5" /></a>}
            {user.social?.twitter && <a href={user.social.twitter} target="_blank" rel="noreferrer" aria-label="Twitter" className="hover:text-fg"><Twitter className="h-5 w-5" /></a>}
            {user.social?.linkedin && <a href={user.social.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:text-fg"><Linkedin className="h-5 w-5" /></a>}
            {user.social?.github && <a href={user.social.github} target="_blank" rel="noreferrer" aria-label="GitHub" className="hover:text-fg"><Github className="h-5 w-5" /></a>}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Profile details" subtitle={editing ? 'Make your changes and save' : 'Select Edit profile to make changes'} />
          <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" value={form.name} onChange={set('name')} error={errors.name} readOnly={readOnly} />
            <Input label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} readOnly={readOnly} />
            <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} error={errors.phone} readOnly={readOnly} />
            <Input label="Location" value={form.location} onChange={set('location')} error={errors.location} readOnly={readOnly} />
            <div className="sm:col-span-2"><Textarea label="Bio" rows={4} value={form.bio} onChange={set('bio')} error={errors.bio} readOnly={readOnly} hint={editing ? `${form.bio.length}/240 characters` : undefined} /></div>
            <div className="sm:col-span-2"><Input label="Expertise" value={form.expertise} onChange={set('expertise')} readOnly={readOnly} hint={editing ? 'Separate with commas, e.g. React, Node.js, System design' : undefined} /></div>
            <div className="sm:col-span-2"><Input label="Website" type="url" value={form.website} onChange={set('website')} error={errors.website} readOnly={readOnly} placeholder="https://" /></div>
            <Input label="Twitter" type="url" value={form.twitter} onChange={set('twitter')} error={errors.twitter} readOnly={readOnly} placeholder="https://" />
            <Input label="LinkedIn" type="url" value={form.linkedin} onChange={set('linkedin')} error={errors.linkedin} readOnly={readOnly} placeholder="https://" />
            <div className="sm:col-span-2"><Input label="GitHub" type="url" value={form.github} onChange={set('github')} error={errors.github} readOnly={readOnly} placeholder="https://" /></div>
            {editing && (
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Button type="submit" loading={saving}>Save changes</Button>
                <Button type="button" variant="outline" disabled={saving} onClick={cancel}>Cancel</Button>
              </div>
            )}
          </form>
        </Card>
      </div>
    </>
  );
}
