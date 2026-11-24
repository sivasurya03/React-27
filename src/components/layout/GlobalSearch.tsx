import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Search, Star, UserRound, X } from 'lucide-react';
import { CourseThumbnail } from '@/components/common/CourseThumbnail';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/utils/storage';

interface Result {
  key: string;
  kind: 'Courses' | 'Instructors' | 'Students' | 'Enrollments';
  label: string;
  sub: string;
  to: string;
  image?: string;
  rating?: number;
}

const MAX_RECENT = 5;

export function GlobalSearch({ autoFocus, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const navigate = useNavigate();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>(() => loadFromStorage<string[]>(STORAGE_KEYS.recentSearches) ?? []);

  const role = useAppSelector((state) => state.auth.user?.role);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const enrollments = useAppSelector((state) => state.enrollment.items);
  const courses = useAppSelector((state) => state.courses.items);
  const instructors = useAppSelector((state) => state.instructors.items);
  const students = useAppSelector((state) => state.students.items);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const match = (text: string) => text.toLowerCase().includes(q);
    const out: Result[] = [
      ...courses.filter((c) => (role === 'instructor' ? c.instructorId === userId : role === 'admin' ? true : c.status === 'published') && (match(c.title) || match(c.category) || c.tags.some(match))).slice(0, 4).map((c) => ({ key: c.id, kind: 'Courses' as const, label: c.title, sub: c.category, to: role === 'instructor' ? `/instructor/courses/${c.id}/preview` : role === 'admin' ? `/admin/courses?q=${encodeURIComponent(c.title)}` : `/courses/${c.id}`, image: c.thumbnail, rating: c.rating })),
      ...instructors.filter((i) => match(i.name)).slice(0, 3).map((i) => ({ key: i.id, kind: 'Instructors' as const, label: i.name, sub: `${i.coursesCount} courses`, to: role === 'admin' ? `/admin/instructors?q=${encodeURIComponent(i.name)}` : role === 'instructor' ? '/instructor/profile' : `/courses?q=${encodeURIComponent(i.name)}` })),
    ];
    if (role === 'admin' || role === 'instructor') {
      const base = role === 'admin' ? '/admin/students' : '/instructor/students';
      out.push(...students.filter((s) => match(s.name) || match(s.email)).slice(0, 3).map((s) => ({ key: s.id, kind: 'Students' as const, label: s.name, sub: s.email, to: role === 'admin' ? `${base}?q=${encodeURIComponent(s.name)}` : base })));
    }
    if (role === 'admin') {
      out.push(...enrollments.flatMap((e) => {
        const student = students.find((s) => s.id === e.studentId);
        const course = courses.find((c) => c.id === e.courseId);
        if (!student || !course || !(match(e.id) || match(student.name) || match(course.title))) return [];
        return [{ key: e.id, kind: 'Enrollments' as const, label: `${student.name} → ${course.title}`, sub: `Enrollment ${e.id}`, to: `/admin/enrollments?q=${encodeURIComponent(e.id)}` }];
      }).slice(0, 3));
    }
    return out;
  }, [query, courses, instructors, students, enrollments, role, userId]);

  useEffect(() => {
    const handler = (event: globalThis.KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const choose = (result: Result): void => {
    const next = [query.trim(), ...recent.filter((r) => r !== query.trim())].slice(0, MAX_RECENT);
    setRecent(next);
    saveToStorage(STORAGE_KEYS.recentSearches, next);
    setOpen(false);
    setQuery('');
    onDone?.();
    navigate(result.to);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter' && results[active]) {
      event.preventDefault();
      choose(results[active]);
    } else if (event.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const showPanel = open && (query.trim() !== '' || recent.length > 0);
  const kinds = [...new Set(results.map((r) => r.kind))];

  return (
    <div className="relative w-full" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false); }}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        ref={inputRef}
        autoFocus={autoFocus}
        role="combobox"
        aria-label="Search courses, instructors and students"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search courses, instructors…"
        className="h-10 w-full rounded-xl border border-line bg-subtle pl-10 pr-16 text-sm text-fg placeholder:text-muted/80 transition focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30"
      />
      {query ? (
        <button type="button" aria-label="Clear search" onClick={() => { setQuery(''); inputRef.current?.focus(); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:text-fg">
          <X className="h-4 w-4" />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-line bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted lg:block">Ctrl K</kbd>
      )}

      {showPanel && (
        <div id={listId} role="listbox" className="absolute left-0 right-0 z-40 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-line bg-surface p-2 shadow-pop">
          {query.trim() === '' ? (
            <>
              <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted">Recent searches</p>
              {recent.map((term) => (
                <button key={term} type="button" onClick={() => { setQuery(term); inputRef.current?.focus(); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-fg hover:bg-subtle">
                  <Clock className="h-4 w-4 text-muted" aria-hidden />
                  {term}
                </button>
              ))}
            </>
          ) : results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">No results for “{query.trim()}”.</p>
          ) : (
            kinds.map((kind) => (
              <div key={kind}>
                <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted">{kind}</p>
                {results.map((r, index) =>
                  r.kind !== kind ? null : (
                    <button
                      key={r.key}
                      type="button"
                      role="option"
                      aria-selected={index === active}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => choose(r)}
                      className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left', index === active ? 'bg-brand/10' : 'hover:bg-subtle')}
                    >
                      {r.image ? <CourseThumbnail src={r.image} alt="" className="h-10 w-14 shrink-0 rounded-md" /> : <UserRound className="h-4 w-4 shrink-0 text-brand-text" aria-hidden />}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-fg">{r.label}</span>
                        <span className="block truncate text-xs text-muted">{r.sub}</span>
                      </span>
                      {r.rating !== undefined && <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />{r.rating.toFixed(1)}</span>}
                    </button>
                  ),
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
