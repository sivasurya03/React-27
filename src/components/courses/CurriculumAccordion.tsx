import { useState } from 'react';
import { CheckCircle2, ClipboardCheck, FileText, HelpCircle, PlayCircle, Download, type LucideIcon } from 'lucide-react';
import { AccordionItem, Badge, Button } from '@/components/ui';
import type { Chapter, LessonType } from '@/types';

const TYPE_ICON: Record<LessonType, LucideIcon> = {
  video: PlayCircle,
  article: FileText,
  quiz: HelpCircle,
  assignment: ClipboardCheck,
  resource: Download,
};
const TYPE_LABEL: Record<LessonType, string> = { video: 'Video', article: 'Article', quiz: 'Quiz', assignment: 'Assignment', resource: 'Resource' };

export function CurriculumAccordion({ chapters, completedIds }: { chapters: Chapter[]; completedIds: string[] }) {
  const [open, setOpen] = useState<string[]>(() => chapters.slice(0, 1).map((c) => c.id));
  const allOpen = open.length === chapters.length;
  const toggle = (id: string): void => setOpen((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <Button size="sm" variant="ghost" onClick={() => setOpen(allOpen ? [] : chapters.map((c) => c.id))}>
          {allOpen ? 'Collapse all' : 'Expand all'}
        </Button>
      </div>
      <div className="rounded-xl border border-line px-4">
        {chapters.map((chapter, index) => {
          const minutes = chapter.lessons.reduce((sum, l) => sum + l.duration, 0);
          const done = chapter.lessons.filter((l) => completedIds.includes(l.id)).length;
          return (
            <AccordionItem
              key={chapter.id}
              open={open.includes(chapter.id)}
              onToggle={() => toggle(chapter.id)}
              title={<>Chapter {index + 1}: {chapter.title}</>}
              meta={<span className="hidden text-xs sm:inline">{done > 0 ? `${done}/` : ''}{chapter.lessons.length} lessons · {minutes} min</span>}
            >
              <ul className="space-y-1">
                {chapter.lessons.map((lesson) => {
                  const Icon = TYPE_ICON[lesson.type];
                  const complete = completedIds.includes(lesson.id);
                  return (
                    <li key={lesson.id} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-subtle">
                      {complete ? <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-emerald-500" aria-label="Completed" /> : <Icon className="h-[18px] w-[18px] shrink-0 text-muted" aria-hidden />}
                      <span className="min-w-0 flex-1 truncate text-fg">{lesson.title}</span>
                      <span className="sr-only">{TYPE_LABEL[lesson.type]}</span>
                      {lesson.isPreview && <Badge variant="brand">Preview</Badge>}
                      <span className="hidden w-16 text-right text-xs text-muted sm:block">{TYPE_LABEL[lesson.type]}</span>
                      <span className="w-12 text-right text-xs tabular-nums text-muted">{lesson.duration} min</span>
                    </li>
                  );
                })}
              </ul>
            </AccordionItem>
          );
        })}
      </div>
    </div>
  );
}
