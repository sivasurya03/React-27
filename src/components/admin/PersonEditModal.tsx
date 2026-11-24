import { useState } from 'react';
import { Button, Input, Modal, Textarea } from '@/components/ui';
import { validateEmail } from '@/utils/validators';

interface Props {
  title: string;
  initial: { name: string; email: string; bio?: string };
  withBio?: boolean;
  saving: boolean;
  onSave: (values: { name: string; email: string; bio: string }) => void;
  onClose: () => void;
}

/** Mounted only while open, so its form state always starts from the current record. */
export function PersonEditModal({ title, initial, withBio, saving, onSave, onClose }: Props) {
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [bio, setBio] = useState(initial.bio ?? '');
  const [errors, setErrors] = useState<{ name?: string; email?: string; bio?: string }>({});

  const submit = (): void => {
    const found = {
      name: name.trim().length < 2 ? 'Enter a name of at least 2 characters.' : name.trim().length > 60 ? 'Name is too long.' : undefined,
      email: validateEmail(email),
      bio: bio.length > 240 ? 'Bio must be 240 characters or fewer.' : undefined,
    };
    setErrors(found);
    if (found.name || found.email || found.bio) return;
    onSave({ name: name.trim(), email: email.trim(), bio: bio.trim() });
  };

  return (
    <Modal open onClose={saving ? () => undefined : onClose} title={title} footer={<><Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button onClick={submit} loading={saving}>Save changes</Button></>}>
      <div className="space-y-4">
        <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        {withBio && <Textarea label="Bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} error={errors.bio} hint={`${bio.length}/240`} />}
      </div>
    </Modal>
  );
}
