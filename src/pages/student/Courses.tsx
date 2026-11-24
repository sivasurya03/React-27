import { useMemo, useState, type ChangeEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Heart, Search, SearchX, SlidersHorizontal } from 'lucide-react';
import { CourseCard } from '@/components/courses/CourseCard';
import { CourseFilters, countActiveFilters, DEFAULT_FILTERS, PRICE_RANGES, type CourseFilterState } from '@/components/courses/CourseFilters';
import { CourseGridSkeleton } from '@/components/courses/CourseGridSkeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, Button, buttonStyles, Card, Drawer, EmptyState, ErrorState, Input, Pagination, Select } from '@/components/ui';
import { fetchCourses } from '@/features/courses/courseSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectInstructorNames, selectPublishedCourses, selectReviewStats, selectWishlistCount } from '@/store/selectors';
import { netPrice } from '@/utils/format';

const PAGE_SIZE = 9;
const SORTS = [
  { value: 'popular', label: 'Most popular' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];

export default function Courses() {
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((state) => state.courses);
  const courses = useAppSelector(selectPublishedCourses);
  const instructorNames = useAppSelector(selectInstructorNames);
  const reviewStats = useAppSelector(selectReviewStats);
  const wishlistCount = useAppSelector(selectWishlistCount);

  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const [filters, setFilters] = useState<CourseFilterState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState('popular');
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState(false);

  /** Duration buckets are derived from the catalogue (tertiles) so every option returns results. */
  const durationBuckets = useMemo(() => {
    const sorted = courses.map((c) => c.duration).sort((a, b) => a - b);
    const low = sorted[Math.floor(sorted.length / 3)] ?? 0;
    const high = sorted[Math.floor((sorted.length * 2) / 3)] ?? 0;
    return { low, high, options: [
      { value: 'short', label: `Under ${low}h` },
      { value: 'medium', label: `${low}h to ${high}h` },
      { value: 'long', label: `Over ${high}h` },
    ] };
  }, [courses]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = courses.filter((c) => {
      const price = netPrice(c.price, c.discount);
      if (q && ![c.title, c.category, instructorNames[c.instructorId] ?? '', ...c.tags].some((t) => t.toLowerCase().includes(q))) return false;
      if (filters.category !== 'all' && c.category !== filters.category) return false;
      if (filters.level !== 'all' && c.level !== filters.level) return false;
      if (filters.rating !== 'all' && c.rating < Number(filters.rating)) return false;
      if (filters.price !== 'all') {
        const [min, max] = PRICE_RANGES[filters.price];
        if (price < min || price >= max) return false;
      }
      if (filters.duration === 'short' && c.duration >= durationBuckets.low) return false;
      if (filters.duration === 'medium' && (c.duration < durationBuckets.low || c.duration > durationBuckets.high)) return false;
      if (filters.duration === 'long' && c.duration <= durationBuckets.high) return false;
      return true;
    });
    const by: Record<string, (a: typeof courses[number], b: typeof courses[number]) => number> = {
      popular: (a, b) => b.studentsCount - a.studentsCount,
      rating: (a, b) => b.rating - a.rating || b.studentsCount - a.studentsCount,
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
      'price-asc': (a, b) => netPrice(a.price, a.discount) - netPrice(b.price, b.discount),
      'price-desc': (a, b) => netPrice(b.price, b.discount) - netPrice(a.price, a.discount),
    };
    return [...filtered].sort(by[sort]);
  }, [courses, query, filters, sort, instructorNames, durationBuckets]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = results.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const active = countActiveFilters(filters);

  const changeFilters = (next: CourseFilterState): void => { setFilters(next); setPage(1); };
  const onSearch = (event: ChangeEvent<HTMLInputElement>): void => {
    const next = new URLSearchParams(params);
    if (event.target.value) next.set('q', event.target.value); else next.delete('q');
    setParams(next, { replace: true });
    setPage(1);
  };
  const clearAll = (): void => { setFilters(DEFAULT_FILTERS); setParams({}, { replace: true }); setPage(1); };

  if (status === 'failed') return <ErrorState title="Could not load courses" message={error ?? undefined} onRetry={() => void dispatch(fetchCourses())} />;

  const filtersPanel = <CourseFilters value={filters} onChange={changeFilters} durationOptions={durationBuckets.options} />;

  return (
    <>
      <PageHeader
        title="Browse courses"
        description="Learn from expert instructors across ten categories."
        actions={<Link to="/wishlist" className={buttonStyles('outline')}><Heart className="mr-2 h-4 w-4" aria-hidden />Wishlist{wishlistCount > 0 && <Badge variant="brand" className="ml-2">{wishlistCount}</Badge>}</Link>}
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Input type="search" aria-label="Search courses" placeholder="Search by title, instructor, category or tag" value={query} onChange={onSearch} leftIcon={<Search className="h-4 w-4" />} />
        </div>
        <div className="flex gap-3">
          <Select aria-label="Sort courses" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} options={SORTS} className="min-w-44" />
          <Button variant="outline" className="lg:hidden" onClick={() => setDrawer(true)} leftIcon={<SlidersHorizontal className="h-4 w-4" />}>
            Filters{active > 0 && <Badge variant="brand" className="ml-1">{active}</Badge>}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <Card className="sticky top-24">
            <h2 className="mb-4 text-sm font-semibold text-fg">Filters</h2>
            {filtersPanel}
          </Card>
        </aside>

        <section aria-live="polite">
          {status !== 'succeeded' ? (
            <CourseGridSkeleton />
          ) : results.length === 0 ? (
            <Card>
              <EmptyState icon={SearchX} title="No courses match your search" description="Try a different keyword or remove some filters." action={<Button onClick={clearAll}>Clear search and filters</Button>} />
            </Card>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted">Showing {visible.length} of {results.length} {results.length === 1 ? 'course' : 'courses'}</p>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence initial={false}>
                  {visible.map((course, index) => (
                    <CourseCard key={course.id} course={course} index={index} instructorName={instructorNames[course.instructorId] ?? 'LearnSphere instructor'} reviewCount={reviewStats[course.id]?.count ?? 0} />
                  ))}
                </AnimatePresence>
              </div>
              <div className="mt-8"><Pagination page={current} totalPages={totalPages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} /></div>
            </>
          )}
        </section>
      </div>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Filter courses" side="right">
        <div className="space-y-4 p-4">
          {filtersPanel}
          <Button fullWidth onClick={() => setDrawer(false)}>Show {results.length} results</Button>
        </div>
      </Drawer>
    </>
  );
}
