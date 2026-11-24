import type { ChangeEvent } from 'react';
import { Button, Select } from '@/components/ui';
import { COURSE_CATEGORIES } from '@/types';

export interface CourseFilterState {
  category: string;
  level: string;
  price: string;
  rating: string;
  duration: string;
}

export const DEFAULT_FILTERS: CourseFilterState = { category: 'all', level: 'all', price: 'all', rating: 'all', duration: 'all' };
export const countActiveFilters = (f: CourseFilterState): number => Object.values(f).filter((v) => v !== 'all').length;

export const PRICE_RANGES: Record<string, [number, number]> = { under50: [0, 50], '50to75': [50, 75], over75: [75, Infinity] };

interface Props {
  value: CourseFilterState;
  onChange: (next: CourseFilterState) => void;
  durationOptions: { value: string; label: string }[];
}

const any = (label: string) => ({ value: 'all', label });

export function CourseFilters({ value, onChange, durationOptions }: Props) {
  const set = (key: keyof CourseFilterState) => (event: ChangeEvent<HTMLSelectElement>) => onChange({ ...value, [key]: event.target.value });
  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()} aria-label="Course filters">
      <Select label="Category" value={value.category} onChange={set('category')} options={[any('All categories'), ...COURSE_CATEGORIES.map((c) => ({ value: c, label: c }))]} />
      <Select label="Level" value={value.level} onChange={set('level')} options={[any('All levels'), { value: 'Beginner', label: 'Beginner' }, { value: 'Intermediate', label: 'Intermediate' }, { value: 'Advanced', label: 'Advanced' }, { value: 'All Levels', label: 'Suitable for all' }]} />
      <Select label="Price" value={value.price} onChange={set('price')} options={[any('Any price'), { value: 'under50', label: 'Under $50' }, { value: '50to75', label: '$50 to $75' }, { value: 'over75', label: 'Over $75' }]} />
      <Select label="Rating" value={value.rating} onChange={set('rating')} options={[any('Any rating'), { value: '4.5', label: '4.5 & up' }, { value: '4.7', label: '4.7 & up' }, { value: '4.8', label: '4.8 & up' }]} />
      <Select label="Duration" value={value.duration} onChange={set('duration')} options={[any('Any duration'), ...durationOptions]} />
      <Button variant="outline" fullWidth disabled={countActiveFilters(value) === 0} onClick={() => onChange(DEFAULT_FILTERS)}>Clear filters</Button>
    </form>
  );
}
