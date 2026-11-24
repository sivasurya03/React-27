import type { AdminSettings, User } from '@/types';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/utils/storage';

/** Mock backend for admin-controlled data: account statuses, profile overrides and platform settings. */
export type PersonStatus = 'active' | 'suspended' | 'deactivated' | 'pending';

export interface PersonOverride {
  status?: PersonStatus;
  name?: string;
  email?: string;
  bio?: string;
}

interface AdminDbShape {
  students: Record<string, PersonOverride>;
  instructors: Record<string, PersonOverride>;
  settings: AdminSettings;
}

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  platformName: 'LearnSphere',
  supportEmail: 'support@learnsphere.demo',
  timezone: 'Asia/Kolkata',
  currency: 'USD',
  notifications: { newStudent: true, newInstructor: true, courseSubmitted: true, enrollment: true, revenue: true, system: true },
  allowRegistrations: true,
  instructorApprovals: true,
  courseApprovals: true,
  maintenanceMode: false,
  sessionTimeout: '60',
  strongPasswords: true,
};

const KEY = 'lms:admin-db';
let cache: AdminDbShape | null = null;

const seed = (): AdminDbShape => ({
  students: { s9: { status: 'suspended' } },
  instructors: { i8: { status: 'pending' } },
  settings: DEFAULT_ADMIN_SETTINGS,
});

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function db(): AdminDbShape {
  if (!cache) {
    const stored = loadFromStorage<unknown>(KEY);
    const base = seed();
    cache = isRecord(stored)
      ? {
          students: isRecord(stored.students) ? (stored.students as AdminDbShape['students']) : base.students,
          instructors: isRecord(stored.instructors) ? (stored.instructors as AdminDbShape['instructors']) : base.instructors,
          settings: isRecord(stored.settings) ? { ...base.settings, ...(stored.settings as Partial<AdminSettings>), notifications: { ...base.settings.notifications, ...(isRecord((stored.settings as Record<string, unknown>).notifications) ? ((stored.settings as Record<string, unknown>).notifications as Partial<AdminSettings['notifications']>) : {}) } } : base.settings,
        }
      : base;
  }
  return cache;
}

const persist = (): void => saveToStorage(KEY, db());

export const adminDb = {
  settings: (): AdminSettings => db().settings,
  saveSettings(next: AdminSettings): AdminSettings {
    db().settings = next;
    persist();
    return next;
  },
  students: (): Record<string, PersonOverride> => db().students,
  instructors: (): Record<string, PersonOverride> => db().instructors,
  patchStudent(id: string, patch: PersonOverride): void {
    db().students = { ...db().students, [id]: { ...db().students[id], ...patch } };
    persist();
  },
  patchInstructor(id: string, patch: PersonOverride): void {
    db().instructors = { ...db().instructors, [id]: { ...db().instructors[id], ...patch } };
    persist();
  },
  /** Students who registered through the app (stored by the auth service). */
  registeredStudents: (): User[] => (loadFromStorage<{ user: User }[]>(STORAGE_KEYS.users) ?? []).map((a) => a.user).filter((u) => u.role === 'student'),
};
