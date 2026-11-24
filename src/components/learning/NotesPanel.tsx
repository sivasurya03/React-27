import { useState } from 'react';
import { Button, Textarea, useToast } from '@/components/ui';

export function NotesPanel({ saved, onSave }: { saved: string; onSave: (text: string) => void }) {
  const [text, setText] = useState(saved);
  const toast = useToast();
  const dirty = text !== saved;
  return (
    <div className="space-y-3">
      <Textarea label="My notes for this lesson" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write down key ideas, questions or links…" hint="Notes are saved on this device." />
      <Button disabled={!dirty} onClick={() => { onSave(text.trim()); toast.success('Notes saved'); }}>Save notes</Button>
    </div>
  );
}
