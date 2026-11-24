import { useRef } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { Button, Select } from '@/components/ui';
import type { LearningResource, ResourceType } from '@/types';

const TYPES: { value: ResourceType; label: string }[] = [
  { value: 'pdf', label: 'PDF' }, { value: 'notes', label: 'Notes' }, { value: 'slides', label: 'Slides' },
  { value: 'document', label: 'Document' }, { value: 'zip', label: 'ZIP' }, { value: 'reference', label: 'Reference' },
];
const uid = (): string => `r-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function ResourceEditor({ resources, onChange }: { resources: LearningResource[]; onChange: (next: LearningResource[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pending = useRef<string | null>(null);
  const update = (id: string, patch: Partial<LearningResource>): void => onChange(resources.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-3">
      <input ref={fileRef} type="file" className="sr-only" aria-label="Choose file for resource" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file && pending.current) update(pending.current, { title: resources.find((r) => r.id === pending.current)?.title || file.name, sizeKb: Math.max(1, Math.round(file.size / 1024)) });
        e.target.value = '';
      }} />
      {resources.length === 0 && <p className="text-sm text-muted">No resources yet. Add study files for students to download.</p>}
      {resources.map((r) => (
        <div key={r.id} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
          <label className="block text-sm"><span className="mb-1 block font-medium text-fg">Title</span>
            <input value={r.title} onChange={(e) => update(r.id, { title: e.target.value })} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30" />
          </label>
          <Select label="Type" value={r.type} onChange={(e) => update(r.id, { type: e.target.value as ResourceType })} options={TYPES} />
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" leftIcon={<Upload className="h-4 w-4" />} onClick={() => { pending.current = r.id; fileRef.current?.click(); }}>{r.sizeKb > 0 ? `${r.sizeKb} KB` : 'File'}</Button>
            <Button size="sm" variant="ghost" aria-label={`Remove resource ${r.title || ''}`} onClick={() => onChange(resources.filter((x) => x.id !== r.id))}><Trash2 className="h-4 w-4 text-rose-600" /></Button>
          </div>
        </div>
      ))}
      <Button size="sm" variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => onChange([...resources, { id: uid(), title: '', type: 'pdf', sizeKb: 0 }])}>Add resource</Button>
      <p className="text-xs text-muted">Upload is simulated: only the file size is recorded in this demo.</p>
    </div>
  );
}
