import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import type { QuizQuestion } from '@/types';
import { cn } from '@/utils/cn';

const uid = (): string => `q-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const MAX_OPTIONS = 6;

export function QuizBuilder({ questions, onChange, showErrors }: { questions: QuizQuestion[]; onChange: (next: QuizQuestion[]) => void; showErrors: boolean }) {
  const update = (index: number, patch: Partial<QuizQuestion>): void => onChange(questions.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  const move = (index: number, delta: number): void => {
    const next = [...questions];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const setOption = (qi: number, oi: number, value: string): void => update(qi, { options: questions[qi].options.map((o, i) => (i === oi ? value : o)) });
  const removeOption = (qi: number, oi: number): void => {
    const q = questions[qi];
    const correctIndex = q.correctIndex === oi ? 0 : q.correctIndex > oi ? q.correctIndex - 1 : q.correctIndex;
    update(qi, { options: q.options.filter((_, i) => i !== oi), correctIndex });
  };

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => {
        const promptError = showErrors && !q.prompt.trim();
        return (
          <fieldset key={q.id} className="rounded-xl border border-line p-4">
            <legend className="px-1 text-sm font-semibold text-fg">Question {qi + 1}</legend>
            <Input label="Question text" value={q.prompt} onChange={(e) => update(qi, { prompt: e.target.value })} error={promptError ? 'Enter the question text.' : undefined} />
            <div className="mt-3 space-y-2" role="radiogroup" aria-label={`Correct answer for question ${qi + 1}`}>
              {q.options.map((option, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input type="radio" name={`correct-${q.id}`} checked={q.correctIndex === oi} onChange={() => update(qi, { correctIndex: oi })} aria-label={`Mark option ${oi + 1} as correct`} className="h-4 w-4 shrink-0 accent-brand" />
                  <input value={option} onChange={(e) => setOption(qi, oi, e.target.value)} aria-label={`Option ${oi + 1}`} placeholder={`Option ${oi + 1}`} className={cn('min-w-0 flex-1 rounded-lg border bg-surface px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30', showErrors && !option.trim() && q.correctIndex === oi ? 'border-rose-500' : 'border-line')} />
                  <button type="button" onClick={() => removeOption(qi, oi)} disabled={q.options.length <= 2} aria-label={`Remove option ${oi + 1}`} className="rounded-md p-1.5 text-muted hover:text-rose-600 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">Select the radio button next to the correct answer.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" disabled={q.options.length >= MAX_OPTIONS} leftIcon={<Plus className="h-4 w-4" />} onClick={() => update(qi, { options: [...q.options, ''] })}>Add option</Button>
              <span className="ml-auto flex gap-1">
                <Button size="sm" variant="ghost" aria-label={`Move question ${qi + 1} up`} disabled={qi === 0} onClick={() => move(qi, -1)}><ArrowUp className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" aria-label={`Move question ${qi + 1} down`} disabled={qi === questions.length - 1} onClick={() => move(qi, 1)}><ArrowDown className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" aria-label={`Delete question ${qi + 1}`} onClick={() => onChange(questions.filter((_, i) => i !== qi))}><Trash2 className="h-4 w-4 text-rose-600" /></Button>
              </span>
            </div>
          </fieldset>
        );
      })}
      <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => onChange([...questions, { id: uid(), prompt: '', options: ['', '', '', ''], correctIndex: 0 }])}>Add question</Button>
    </div>
  );
}
