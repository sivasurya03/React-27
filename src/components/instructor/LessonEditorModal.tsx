import { useState } from 'react';
import { Button, Checkbox, Input, Modal, Select, Textarea } from '@/components/ui';
import type { Lesson, LessonContent, LessonType } from '@/types';
import { LESSON_TYPES, validateAssignment, validateQuiz } from '@/utils/courseBuilder';
import { QuizBuilder } from './QuizBuilder';
import { ResourceEditor } from './ResourceEditor';

interface Props {
  lesson: Lesson;
  content?: LessonContent;
  onSave: (lesson: Lesson, content: LessonContent | undefined) => void;
  onClose: () => void;
}

const DEFAULT_ASSIGNMENT = { instructions: [''], maxScore: 100, dueDays: 14, requireSubmission: true };

/** Edits one lesson, including its quiz, assignment or resources. Mounted only while open, so state starts fresh. */
export function LessonEditorModal({ lesson, content, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<Lesson>(lesson);
  const [data, setData] = useState<LessonContent>(content ?? {});
  const [errors, setErrors] = useState<{ title?: string; duration?: string; content?: string }>({});
  const [showErrors, setShowErrors] = useState(false);

  const assignment = data.assignment ?? DEFAULT_ASSIGNMENT;

  const save = (): void => {
    const next: typeof errors = {};
    if (!draft.title.trim()) next.title = 'Enter a lesson title.';
    if (!(draft.duration >= 1 && draft.duration <= 600)) next.duration = 'Duration must be 1 to 600 minutes.';
    if (draft.type === 'quiz') next.content = validateQuiz(data.quiz);
    if (draft.type === 'assignment') next.content = validateAssignment(data.assignment ?? DEFAULT_ASSIGNMENT);
    setErrors(next);
    setShowErrors(true);
    if (next.title || next.duration || next.content) return;
    const keep: LessonContent = {};
    if (draft.type === 'quiz') keep.quiz = data.quiz;
    if (draft.type === 'assignment') keep.assignment = { ...assignment, instructions: assignment.instructions.map((i) => i.trim()).filter(Boolean) };
    if (draft.type === 'assignment' || draft.type === 'resource') keep.resources = (data.resources ?? []).filter((r) => r.title.trim());
    onSave({ ...draft, title: draft.title.trim() }, Object.keys(keep).length ? keep : undefined);
  };

  return (
    <Modal open onClose={onClose} size="lg" title="Edit lesson" footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>Save lesson</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Input label="Lesson title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} error={errors.title} /></div>
        <Select label="Lesson type" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as LessonType })} options={LESSON_TYPES} />
        <Input label="Duration (minutes)" type="number" min={1} value={String(draft.duration)} onChange={(e) => setDraft({ ...draft, duration: Number(e.target.value) })} error={errors.duration} />
        <div className="sm:col-span-2"><Checkbox label="Free preview (visible to students before enrolling)" checked={draft.isPreview} onChange={(e) => setDraft({ ...draft, isPreview: e.target.checked })} /></div>
      </div>

      {draft.type === 'quiz' && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-fg">Quiz questions</h3>
          <QuizBuilder questions={data.quiz ?? []} onChange={(quiz) => setData({ ...data, quiz })} showErrors={showErrors} />
        </div>
      )}

      {draft.type === 'assignment' && (
        <div className="mt-6 space-y-4">
          <h3 className="text-sm font-semibold text-fg">Assignment details</h3>
          <Textarea label="Instructions (one step per line)" rows={5} value={assignment.instructions.join('\n')} onChange={(e) => setData({ ...data, assignment: { ...assignment, instructions: e.target.value.split('\n') } })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Max score" type="number" min={1} value={String(assignment.maxScore)} onChange={(e) => setData({ ...data, assignment: { ...assignment, maxScore: Number(e.target.value) } })} />
            <Input label="Due (days after enrolment)" type="number" min={1} value={String(assignment.dueDays)} onChange={(e) => setData({ ...data, assignment: { ...assignment, dueDays: Number(e.target.value) } })} />
          </div>
          <Checkbox label="Students must submit a response to complete this lesson" checked={assignment.requireSubmission ?? true} onChange={(e) => setData({ ...data, assignment: { ...assignment, requireSubmission: e.target.checked } })} />
          <div><h4 className="mb-2 text-sm font-medium text-fg">Attachments</h4><ResourceEditor resources={data.resources ?? []} onChange={(resources) => setData({ ...data, resources })} /></div>
        </div>
      )}

      {draft.type === 'resource' && (
        <div className="mt-6"><h3 className="mb-3 text-sm font-semibold text-fg">Resources</h3><ResourceEditor resources={data.resources ?? []} onChange={(resources) => setData({ ...data, resources })} /></div>
      )}

      {errors.content && <p role="alert" className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">{errors.content}</p>}
    </Modal>
  );
}
