import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Captions, CheckCircle2, Maximize, Minimize, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX, WifiOff } from 'lucide-react';
import { CourseThumbnail } from '@/components/common/CourseThumbnail';
import { Button, Spinner } from '@/components/ui';
import { useDemoPlayback } from '@/hooks/useDemoPlayback';
import { cn } from '@/utils/cn';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const QUALITIES = ['Auto', '1080p', '720p', '480p', '360p'];

const formatTime = (sec: number): string => {
  const total = Math.floor(sec);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

interface Props {
  title: string;
  poster: string;
  durationSec: number;
  completed: boolean;
  captions: string[];
  onMarkComplete: () => void;
}

const selectClass = 'h-8 rounded-md border border-white/20 bg-black/50 px-1.5 text-xs text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70';

export function VideoPlayer({ title, poster, durationSec, completed, captions, onMarkComplete }: Props) {
  const p = useDemoPlayback(durationSec);
  const containerRef = useRef<HTMLDivElement>(null);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [quality, setQuality] = useState('Auto');
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onChange = (): void => setFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = (): void => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else el.requestFullscreen().catch(() => undefined);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT') return;
    if (target.tagName === 'BUTTON' && (event.key === ' ' || event.key === 'Enter')) return;
    if (event.key === ' ' || event.key.toLowerCase() === 'k') { event.preventDefault(); p.toggle(); }
    else if (event.key === 'ArrowRight') p.skip(5);
    else if (event.key === 'ArrowLeft') p.skip(-5);
    else if (event.key.toLowerCase() === 'm') p.toggleMute();
    else if (event.key.toLowerCase() === 'f') toggleFullscreen();
  };

  const caption = captions.length ? captions[Math.min(captions.length - 1, Math.floor((p.time / durationSec) * captions.length))] : '';
  const iconButton = 'flex h-9 w-9 items-center justify-center rounded-lg text-white transition hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/70';

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      role="group"
      aria-label={`Video player: ${title}`}
      className={cn('group relative overflow-hidden bg-slate-950 text-white', fullscreen ? 'h-screen w-screen' : 'aspect-video rounded-2xl shadow-card')}
    >
      <CourseThumbnail src={poster} alt="" className={cn('absolute inset-0 h-full w-full transition-opacity', p.playing ? 'opacity-30' : 'opacity-60')} />

      {p.playing && (
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
          <div className="flex h-16 items-end gap-1.5">
            {[0.5, 0.9, 0.6, 1, 0.7, 0.85, 0.55].map((h, i) => (
              <span key={i} className="w-1.5 animate-pulse rounded-full bg-white/70" style={{ height: `${h * 100}%`, animationDelay: `${i * 120}ms` }} />
            ))}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute left-3 right-3 top-3 flex items-start justify-between gap-3">
        <span className="rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium uppercase tracking-wide">Demo lesson playback</span>
        {completed && <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden />Completed</span>}
      </div>

      {p.status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/70" role="status">
          <Spinner className="h-8 w-8 text-white" label="Loading lesson video" />
          <p className="text-sm text-white/80">Preparing your lesson…</p>
        </div>
      )}

      {p.status === 'error' && (
        <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/85 p-6 text-center">
          <WifiOff className="h-9 w-9" aria-hidden />
          <p className="font-semibold">We could not load this video</p>
          <p className="max-w-sm text-sm text-white/75">Check your connection and try again.</p>
          <Button variant="secondary" onClick={p.retry}>Retry</Button>
        </div>
      )}

      {p.status === 'ready' && !p.playing && !p.ended && (
        <button type="button" onClick={p.play} aria-label="Play video" className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-pop transition group-hover:scale-105 sm:h-20 sm:w-20"><Play className="ml-1 h-7 w-7 sm:h-9 sm:w-9" aria-hidden /></span>
        </button>
      )}

      {p.ended && p.status === 'ready' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/75 p-4 text-center">
          <p className="text-lg font-semibold">Lesson finished</p>
          <div className="flex flex-wrap justify-center gap-2">
            {!completed && <Button onClick={onMarkComplete} leftIcon={<CheckCircle2 className="h-4 w-4" />}>Mark as complete</Button>}
            <Button variant="secondary" onClick={p.play} leftIcon={<RotateCcw className="h-4 w-4" />}>Replay</Button>
          </div>
        </div>
      )}

      {captionsOn && caption && p.status === 'ready' && (
        <p className="pointer-events-none absolute inset-x-4 bottom-20 mx-auto w-fit max-w-[90%] rounded-md bg-black/75 px-3 py-1.5 text-center text-sm sm:bottom-24 sm:text-base">{caption}</p>
      )}

      <div className="absolute inset-x-0 bottom-0 space-y-1 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2 pt-8">
        <input
          type="range"
          min={0}
          max={durationSec}
          step={1}
          value={Math.floor(p.time)}
          onChange={(e) => p.seek(Number(e.target.value))}
          aria-label="Seek"
          aria-valuetext={`${formatTime(p.time)} of ${formatTime(durationSec)}`}
          disabled={p.status !== 'ready'}
          className="h-1.5 w-full cursor-pointer accent-indigo-400"
        />
        <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
          <button type="button" onClick={p.toggle} aria-label={p.playing ? 'Pause' : 'Play'} className={iconButton} disabled={p.status !== 'ready'}>
            {p.playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <button type="button" onClick={() => p.skip(-10)} aria-label="Back 10 seconds" className={iconButton}><RotateCcw className="h-4 w-4" /></button>
          <button type="button" onClick={() => p.skip(10)} aria-label="Forward 10 seconds" className={iconButton}><RotateCw className="h-4 w-4" /></button>
          <button type="button" onClick={p.toggleMute} aria-label={p.muted ? 'Unmute' : 'Mute'} className={iconButton}>
            {p.muted || p.volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          <input type="range" min={0} max={1} step={0.05} value={p.muted ? 0 : p.volume} onChange={(e) => p.setVolume(Number(e.target.value))} aria-label="Volume" className="hidden h-1 w-20 cursor-pointer accent-indigo-400 sm:block" />
          <span className="px-2 text-xs tabular-nums text-white/90" aria-live="off">{formatTime(p.time)} / {formatTime(durationSec)}</span>
          <div className="ml-auto flex items-center gap-1">
            <button type="button" onClick={() => setCaptionsOn((v) => !v)} aria-pressed={captionsOn} aria-label="Captions" className={cn(iconButton, captionsOn && 'bg-white/25')}><Captions className="h-5 w-5" /></button>
            <select aria-label="Playback speed" value={p.speed} onChange={(e) => p.setSpeed(Number(e.target.value))} className={selectClass}>
              {SPEEDS.map((s) => <option key={s} value={s} className="text-black">{s}x</option>)}
            </select>
            <select aria-label="Video quality" value={quality} onChange={(e) => setQuality(e.target.value)} className={cn(selectClass, 'hidden sm:block')}>
              {QUALITIES.map((q) => <option key={q} value={q} className="text-black">{q}</option>)}
            </select>
            <button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} className={iconButton}>
              {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
