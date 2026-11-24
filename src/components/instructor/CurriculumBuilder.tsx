import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion';
import { ArrowDown, ArrowUp, ChevronDown, ClipboardCheck, Download, FileText, GripVertical, HelpCircle, Pencil, Plus, PlayCircle, Trash2, type LucideIcon } from 'lucide-react';
import { Badge, Button, ConfirmDialog, Select } from '@/components/ui';
import type { Chapter, Lesson, LessonContent, LessonType } from '@/types';
import { cn } from '@/utils/cn';
import { LESSON_TYPES, newChapter, newLesson } from '@/utils/courseBuilder';
import { LessonEditorModal } from './LessonEditorModal';

const ICONS: Record<LessonType, LucideIcon> = { video: PlayCircle, article: FileText, quiz: HelpCircle, assignment: ClipboardCheck, resource: Download };

interface Props {
  courseId: string;
  chapters: Chapter[];
  content: Record<string, LessonContent>;
  onChange: (chapters: Chapter[], content: Record<string, LessonContent>) => void;
  error?: string;
}

type Pending = { kind: 'chapter'; id: string } | { kind: 'lesson'; chapterId: string; id: string } | null;

function swap<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function LessonRow({ lesson, index, total, onEdit, onDelete, onMove }: { lesson: Lesson; index: number; total: number; onEdit: () => void; onDelete: () => void; onMove: (delta: number) => void }) {
  const controls = useDragControls();
  const Icon = ICONS[lesson.type];
  return (
    <Reorder.Item value={lesson} dragListener={false} dragControls={controls} whileDrag={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }} className="flex items-center gap-2 rounded-lg border border-line bg-surface px-2 py-2">
      <button type="button" onPointerDown={(e) => controls.start(e)} aria-label={`Drag to reorder ${lesson.title}`} className="cursor-grab touch-none rounded p-1 text-muted hover:text-fg active:cursor-grabbing"><GripVertical className="h-4 w-4" /></button>
      <Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden />
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-medium text-fg">{lesson.title || 'Untitled lesson'}</span>
        <span className="text-xs capitalize text-muted">{lesson.type} · {lesson.duration} min</span>
      </button>
      {lesson.isPreview && <Badge variant="brand" className="hidden sm:inline-flex">Preview</Badge>}
      <span className="flex shrink-0">
        <Button size="sm" variant="ghost" aria-label={`Move ${lesson.title} up`} disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" aria-label={`Move ${lesson.title} down`} disabled={index === total - 1} onClick={() => onMove(1)}><ArrowDown className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" aria-label={`Edit ${lesson.title}`} onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" aria-label={`Delete ${lesson.title}`} onClick={onDelete}><Trash2 className="h-4 w-4 text-rose-600" /></Button>
      </span>
    </Reorder.Item>
  );
}

function ChapterCard({ chapter, index, total, open, onToggle, onRename, onMove, onDelete, children }: {
  chapter: Chapter; index: number; total: number; open: boolean; onToggle: () => void; onRename: (title: string) => void; onMove: (delta: number) => void; onDelete: () => void; children: ReactNode;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={chapter} dragListener={false} dragControls={controls} whileDrag={{ scale: 1.01, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }} className="rounded-2xl border border-line bg-subtle/40">
      <div className="flex items-center gap-1.5 p-2 sm:gap-2 sm:p-3">
        <button type="button" onPointerDown={(e) => controls.start(e)} aria-label={`Drag to reorder chapter ${index + 1}`} className="cursor-grab touch-none rounded p-1.5 text-muted hover:text-fg active:cursor-grabbing"><GripVertical className="h-5 w-5" /></button>
        <input value={chapter.title} onChange={(e) => onRename(e.target.value)} aria-label={`Chapter ${index + 1} title`} placeholder="Chapter title" className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm font-semibold text-fg hover:border-line focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30" />
        <span className="hidden text-xs text-muted sm:inline">{chapter.lessons.length} lessons</span>
        <Button size="sm" variant="ghost" aria-label={`Move chapter ${index + 1} up`} disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" aria-label={`Move chapter ${index + 1} down`} disabled={index === total - 1} onClick={() => onMove(1)}><ArrowDown className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" aria-label={`Delete chapter ${index + 1}`} onClick={onDelete}><Trash2 className="h-4 w-4 text-rose-600" /></Button>
        <Button size="sm" variant="ghost" aria-expanded={open} aria-label={open ? 'Collapse chapter' : 'Expand chapter'} onClick={onToggle}><ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} /></Button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="space-y-2 px-2 pb-3 sm:px-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

export function CurriculumBuilder({ courseId, chapters, content, onChange, error }: Props) {
  const [open, setOpen] = useState<string[]>(() => chapters.map((c) => c.id));
  const [editing, setEditing] = useState<{ chapterId: string; lessonId: string } | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [newType, setNewType] = useState<LessonType>('video');

  const patchChapter = (id: string, fn: (c: Chapter) => Chapter): void => onChange(chapters.map((c) => (c.id === id ? fn(c) : c)), content);
  const addChapter = (): void => {
    const chapter = newChapter(courseId, `Chapter ${chapters.length + 1}`);
    setOpen((list) => [...list, chapter.id]);
    onChange([...chapters, chapter], content);
  };
  const addLesson = (chapterId: string): void => {
    const lesson = newLesson(courseId, chapterId, newType, `${LESSON_TYPES.find((t) => t.value === newType)?.label ?? 'Lesson'} ${(chapters.find((c) => c.id === chapterId)?.lessons.length ?? 0) + 1}`);
    patchChapter(chapterId, (c) => ({ ...c, lessons: [...c.lessons, lesson] }));
    setEditing({ chapterId, lessonId: lesson.id });
  };
  const confirmDelete = (): void => {
    if (!pending) return;
    if (pending.kind === 'chapter') {
      const removed = chapters.find((c) => c.id === pending.id);
      const ids = new Set(removed?.lessons.map((l) => l.id));
      onChange(chapters.filter((c) => c.id !== pending.id), Object.fromEntries(Object.entries(content).filter(([id]) => !ids.has(id))));
    } else {
      const { chapterId, id } = pending;
      onChange(chapters.map((c) => (c.id === chapterId ? { ...c, lessons: c.lessons.filter((l) => l.id !== id) } : c)), Object.fromEntries(Object.entries(content).filter(([key]) => key !== id)));
    }
    setPending(null);
  };

  const editingLesson = editing ? chapters.find((c) => c.id === editing.chapterId)?.lessons.find((l) => l.id === editing.lessonId) : undefined;

  return (
    <div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>}
      {chapters.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-8 text-center">
          <p className="font-medium text-fg">Start building your curriculum</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">Add a chapter, then add videos, articles, quizzes, assignments and resources.</p>
        </div>
      ) : (
        <Reorder.Group axis="y" values={chapters} onReorder={(next) => onChange(next, content)} className="space-y-3">
          {chapters.map((chapter, ci) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              index={ci}
              total={chapters.length}
              open={open.includes(chapter.id)}
              onToggle={() => setOpen((list) => (list.includes(chapter.id) ? list.filter((x) => x !== chapter.id) : [...list, chapter.id]))}
              onRename={(title) => patchChapter(chapter.id, (c) => ({ ...c, title }))}
              onMove={(delta) => onChange(swap(chapters, ci, delta), content)}
              onDelete={() => setPending({ kind: 'chapter', id: chapter.id })}
            >
              {chapter.lessons.length === 0 && <p className="px-2 py-3 text-sm text-muted">No lessons yet.</p>}
              <Reorder.Group axis="y" values={chapter.lessons} onReorder={(lessons) => patchChapter(chapter.id, (c) => ({ ...c, lessons }))} className="space-y-2">
                {chapter.lessons.map((lesson, li) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    index={li}
                    total={chapter.lessons.length}
                    onEdit={() => setEditing({ chapterId: chapter.id, lessonId: lesson.id })}
                    onDelete={() => setPending({ kind: 'lesson', chapterId: chapter.id, id: lesson.id })}
                    onMove={(delta) => patchChapter(chapter.id, (c) => ({ ...c, lessons: swap(c.lessons, li, delta) }))}
                  />
                ))}
              </Reorder.Group>
              <div className="flex flex-wrap items-end gap-2 pt-1">
                <div className="w-40"><Select aria-label="New lesson type" value={newType} onChange={(e) => setNewType(e.target.value as LessonType)} options={LESSON_TYPES} /></div>
                <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => addLesson(chapter.id)}>Add lesson</Button>
              </div>
            </ChapterCard>
          ))}
        </Reorder.Group>
      )}
      <Button className="mt-4" variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={addChapter}>Add chapter</Button>

      {editing && editingLesson && (
        <LessonEditorModal
          lesson={editingLesson}
          content={content[editingLesson.id]}
          onClose={() => setEditing(null)}
          onSave={(lesson, lessonContent) => {
            const nextContent = { ...content };
            if (lessonContent) nextContent[lesson.id] = lessonContent;
            else delete nextContent[lesson.id];
            onChange(chapters.map((c) => (c.id === editing.chapterId ? { ...c, lessons: c.lessons.map((l) => (l.id === lesson.id ? lesson : l)) } : c)), nextContent);
            setEditing(null);
          }}
        />
      )}

      <ConfirmDialog open={pending !== null} title={pending?.kind === 'chapter' ? 'Delete chapter?' : 'Delete lesson?'} confirmLabel="Delete" danger onConfirm={confirmDelete} onClose={() => setPending(null)}>
        {pending?.kind === 'chapter' ? 'This removes the chapter and all of its lessons.' : 'This removes the lesson and its quiz, assignment or resources.'}
      </ConfirmDialog>
    </div>
  );
}
