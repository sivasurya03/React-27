import type { AuthSession, User } from '@/types';
import { DEMO_PASSWORD, demoAccounts } from '@/data/people';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/utils/storage';
import { adminDb } from './adminDb';
import { mockRequest } from './mock';

interface StoredAccount {
  password: string;
  user: User;
}

const loadRegistered = (): StoredAccount[] => loadFromStorage<StoredAccount[]>(STORAGE_KEYS.users) ?? [];
const allAccounts = (): StoredAccount[] => [
  ...demoAccounts.map((user) => ({ password: DEMO_PASSWORD, user })),
  ...loadRegistered(),
];
/** Applies profile edits the user saved earlier (stored per user id). */
const withSavedProfile = (user: User): User => {
  const saved = loadFromStorage<Record<string, User>>(STORAGE_KEYS.profiles)?.[user.id];
  return saved ? { ...user, ...saved } : user;
};
const sameEmail = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

export const authService = {
  login: (email: string, password: string): Promise<AuthSession> =>
    mockRequest(() => {
      const account = allAccounts().find((a) => sameEmail(a.user.email, email));
      if (!account || account.password !== password) throw new Error('Invalid email or password.');
      const role = account.user.role;
      const override = role === 'student' ? adminDb.students()[account.user.id] : role === 'instructor' ? adminDb.instructors()[account.user.id] : undefined;
      if (override?.status === 'suspended') throw new Error('Your account has been suspended. Please contact support.');
      if (override?.status === 'deactivated') throw new Error('Your account has been deactivated. Please contact support.');
      if (role !== 'admin' && adminDb.settings().maintenanceMode) throw new Error('The platform is under maintenance. Please try again later.');
      return { user: withSavedProfile(account.user), token: `demo-${account.user.id}-${Date.now()}` };
    }),

  register: (input: { name: string; email: string; password: string }): Promise<AuthSession> =>
    mockRequest(() => {
      if (!adminDb.settings().allowRegistrations) throw new Error('New registrations are currently closed.');
      if (allAccounts().some((a) => sameEmail(a.user.email, input.email))) {
        throw new Error('An account with this email already exists.');
      }
      const user: User = {
        id: `s-new-${Date.now()}`,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        role: 'student',
        createdAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEYS.users, [...loadRegistered(), { password: input.password, user }]);
      return { user, token: `demo-${user.id}` };
    }),

  /** Demo accounts verify the current password but keep their original one; registered users are updated. */
  changePassword: (userId: string, current: string, next: string): Promise<{ persisted: boolean }> =>
    mockRequest(() => {
      const account = allAccounts().find((a) => a.user.id === userId);
      if (!account || account.password !== current) throw new Error('Your current password is incorrect.');
      const registered = loadRegistered();
      const isRegistered = registered.some((a) => a.user.id === userId);
      if (isRegistered) saveToStorage(STORAGE_KEYS.users, registered.map((a) => (a.user.id === userId ? { ...a, password: next } : a)));
      return { persisted: isRegistered };
    }, 600),

  requestPasswordReset: (email: string): Promise<{ sent: true; email: string }> =>
    mockRequest(() => ({ sent: true as const, email: email.trim() }), 600),
};
