import type { Role } from '@/types';

export const homeFor = (role: Role): string =>
  role === 'instructor' ? '/instructor' : role === 'admin' ? '/admin' : '/';
