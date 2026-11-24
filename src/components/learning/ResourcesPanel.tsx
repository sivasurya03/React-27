import { BookMarked, Download, FileArchive, FileText, Presentation, StickyNote, type LucideIcon } from 'lucide-react';
import { Badge, Button, EmptyState, useToast } from '@/components/ui';
import type { LearningResource, ResourceType } from '@/types';

const META: Record<ResourceType, { icon: LucideIcon; label: string }> = {
  pdf: { icon: FileText, label: 'PDF' },
  notes: { icon: StickyNote, label: 'Notes' },
  slides: { icon: Presentation, label: 'Slides' },
  document: { icon: FileText, label: 'Document' },
  zip: { icon: FileArchive, label: 'ZIP' },
  reference: { icon: BookMarked, label: 'Reference' },
};

const formatSize = (kb: number): string => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);

/** Generates a small text file in the browser, so there is never a broken download link. */
function downloadDemoFile(resource: LearningResource, courseTitle: string): void {
  const body = `${resource.title}\nCourse: ${courseTitle}\n\nThis is a demo placeholder for "${resource.title}" (${META[resource.type].label}, ${formatSize(resource.sizeKb)}).\nIn a connected LMS this would be the real file.\n`;
  const url = URL.createObjectURL(new Blob([body], { type: 'text/plain' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${resource.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-demo.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

export function ResourcesPanel({ resources, courseTitle }: { resources: LearningResource[]; courseTitle: string }) {
  const toast = useToast();
  if (resources.length === 0) return <EmptyState icon={FileText} title="No resources for this lesson" description="Study materials will appear here when they are added." />;
  return (
    <ul className="divide-y divide-line rounded-xl border border-line">
      {resources.map((resource) => {
        const { icon: Icon, label } = META[resource.type];
        return (
          <li key={resource.id} className="flex items-center gap-3 p-3 sm:p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand-text"><Icon className="h-5 w-5" aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">{resource.title}</p>
              <p className="mt-0.5 flex items-center gap-2 text-xs text-muted"><Badge>{label}</Badge>{formatSize(resource.sizeKb)}</p>
            </div>
            <Button size="sm" variant="outline" aria-label={`Download ${resource.title}`} leftIcon={<Download className="h-4 w-4" />} onClick={() => { downloadDemoFile(resource, courseTitle); toast.info('Demo file downloaded', resource.title); }}>
              <span className="hidden sm:inline">Download</span>
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
