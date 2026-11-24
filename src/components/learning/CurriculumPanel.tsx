import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ClipboardCheck, Download, FileText, HelpCircle, Lock, PlayCircle, type LucideIcon } from 'lucide-react';
import { AccordionItem, ProgressBar } from '@/components/ui';
import type { Chapter, LessonType } from '@/types';
import { cn } from '@/utils/cn';
import { chapterProgress, isLocked, learnPath } from '@/utils/learning';

const ICONS: Record<LessonType, LucideIcon> = { video: PlayCircle, article: FileText, quiz: HelpCircle, assignment: ClipboardCheck, resource: Download };
const LABELS: Record<LessonType, string> = { video: 'Video', article: 'Reading', quiz: 'Quiz', assignment: 'Assignment', resource: 'Resources' };

interface Props {
  courseId: string;
  chapters: Chapter[];
  completedIds: string[];
  activeLessonId: string;
  progress: number;
  onNavigate?: () => void;
}

export function CurriculumPanel({ courseId, chapters, completedIds, activeLessonId, progress, onNavigate }: Props) {
  const activeChapter = chapters.find((c) => c.lessons.some((l) => l.id === activeLessonId))?.id;
  const [open, setOpen] = useState<string[]>(() => (activeChapter ? [activeChapter] : []));

  useEffect(() => {
    if (activeChapter) setOpen((list) => (list.includes(activeChapter) ? list : [...list, activeChapter]));
  }, [activeChapter]);

  const toggle = (id: string): void => setOpen((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  return (
    <nav aria-label="Course curriculum">
      <div className="border-b border-line p-4">
        <p className="text-sm font-semibold text-fg">Course content</p>
        <div className="mt-2"><ProgressBar value={progress} showLabel size="sm" label="Course progress" /></div>
      </div>
      <div className="px-4">
        {chapters.map((chapter, index) => {
          const stats = chapterProgress(chapter, completedIds);
          return (
            <AccordionItem
              key={chapter.id}
              open={open.includes(chapter.id)}
              onToggle={() => toggle(chapter.id)}
              title={<span className="text-sm">Chapter {index + 1} — {chapter.title}</span>}
              meta={<span className="text-xs tabular-nums">{stats.percent}%</span>}
            >
              <ul className="space-y-0.5">
                {chapter.lessons.map((lesson) => {
                  const done = completedIds.includes(lesson.id);
                  const active = lesson.id === activeLessonId;
                  const locked = isLocked(chapters, lesson, completedIds);
                  const Icon = ICONS[lesson.type];
                  const state = done ? <CheckCircle2 className="h-[18px] w-[18px] text-emerald-500" aria-label="Completed" /> : locked ? <Lock className="h-[18px] w-[18px] text-muted" aria-label="Locked" /> : active ? <PlayCircle className="h-[18px] w-[18px] text-brand-text" aria-label="Current lesson" /> : <Icon className="h-[18px] w-[18px] text-muted" aria-hidden />;
                  const body = (
                    <>
                      <span className="mt-0.5 shrink-0">{state}</span>
                      <span className="min-w-0 flex-1">
                        <span className={cn('block text-sm leading-snug', active ? 'font-semibold text-brand-text' : 'text-fg')}>{lesson.title}</span>
                        <span className="block text-xs text-muted">{LABELS[lesson.type]} · {lesson.duration} min{locked ? ' · Locked' : ''}</span>
                      </span>
                    </>
                  );
                  return (
                    <li key={lesson.id}>
                      {locked ? (
                        <span aria-disabled="true" className="flex cursor-not-allowed items-start gap-3 rounded-lg px-2 py-2 opacity-60">{body}</span>
                      ) : (
                        <Link to={learnPath(courseId, lesson.id)} onClick={onNavigate} aria-current={active ? 'page' : undefined} className={cn('flex items-start gap-3 rounded-lg px-2 py-2 transition', active ? 'bg-brand/10' : 'hover:bg-subtle')}>{body}</Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </AccordionItem>
          );
        })}
      </div>
    </nav>
  );
}
