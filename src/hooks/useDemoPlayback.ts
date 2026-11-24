import { useCallback, useEffect, useState } from 'react';

export type PlaybackStatus = 'loading' | 'ready' | 'error';

/**
 * Controlled demo playback: a simulated timeline (no external video is loaded), so the player UI is fully
 * functional without any network dependency. It reports an error state when the browser is offline.
 */
export function useDemoPlayback(durationSec: number) {
  const [status, setStatus] = useState<PlaybackStatus>('loading');
  const [attempt, setAttempt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const ended = time >= durationSec;

  useEffect(() => {
    setStatus('loading');
    const id = window.setTimeout(() => setStatus(navigator.onLine ? 'ready' : 'error'), 500);
    return () => window.clearTimeout(id);
  }, [attempt]);

  useEffect(() => {
    if (!playing) return undefined;
    const id = window.setInterval(() => setTime((t) => Math.min(durationSec, t + 0.25 * speed)), 250);
    return () => window.clearInterval(id);
  }, [playing, speed, durationSec]);

  useEffect(() => {
    if (ended && playing) setPlaying(false);
  }, [ended, playing]);

  const play = useCallback(() => {
    if (status !== 'ready') return;
    if (time >= durationSec) setTime(0);
    setPlaying(true);
  }, [status, time, durationSec]);
  const pause = useCallback(() => setPlaying(false), []);
  const seek = useCallback((to: number) => setTime(Math.max(0, Math.min(durationSec, to))), [durationSec]);

  return {
    status, playing, time, speed, volume, muted, ended,
    play,
    pause,
    toggle: () => (playing ? pause() : play()),
    seek,
    skip: (delta: number) => seek(time + delta),
    setSpeed,
    setVolume: (v: number) => { setVolume(v); setMuted(v === 0); },
    toggleMute: () => setMuted((m) => !m),
    retry: () => setAttempt((n) => n + 1),
  };
}
