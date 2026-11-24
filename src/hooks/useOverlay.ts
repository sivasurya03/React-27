import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from 'react';

export function useLockScroll(locked: boolean): void {
  useEffect(() => {
    if (!locked) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);
}

export function useEscape(active: boolean, onEscape: () => void): void {
  useEffect(() => {
    if (!active) return undefined;
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onEscape();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [active, onEscape]);
}

export function useClickOutside(ref: RefObject<HTMLElement>, active: boolean, onOutside: () => void): void {
  useEffect(() => {
    if (!active) return undefined;
    const handler = (event: MouseEvent): void => {
      if (ref.current && !ref.current.contains(event.target as Node)) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, active, onOutside]);
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Moves focus into a dialog when it opens, keeps Tab inside it, and restores focus to the opener on close. */
export function useDialogFocus(open: boolean): { ref: RefObject<HTMLDivElement>; onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void } {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement as HTMLElement | null;
    const id = window.setTimeout(() => ref.current?.focus(), 30);
    return () => {
      window.clearTimeout(id);
      previous?.focus();
    };
  }, [open]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLElement>): void => {
    if (event.key !== 'Tab' || !ref.current) return;
    const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return { ref, onKeyDown };
}
