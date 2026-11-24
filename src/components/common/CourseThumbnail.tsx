import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/utils/cn';

export function CourseThumbnail({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div role="img" aria-label={alt} className={cn('flex items-center justify-center bg-subtle text-muted', className)}>
        <ImageOff className="h-6 w-6" aria-hidden />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={cn('object-cover', className)} />;
}
