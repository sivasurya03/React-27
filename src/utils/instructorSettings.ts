import type { InstructorSettings, User } from '@/types';

export const DEFAULT_INSTRUCTOR_SETTINGS: InstructorSettings = {
  notifications: { enrollment: true, assignment: true, review: true, payment: true, platform: false },
  profileVisible: true,
  defaultVisibility: 'draft',
  emailPreferences: 'important',
};

export const settingsOf = (user: User | null): InstructorSettings => ({
  ...DEFAULT_INSTRUCTOR_SETTINGS,
  ...user?.instructorSettings,
  notifications: { ...DEFAULT_INSTRUCTOR_SETTINGS.notifications, ...user?.instructorSettings?.notifications },
});

export const isUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};
