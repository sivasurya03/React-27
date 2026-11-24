const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) return 'Email is required.';
  return EMAIL_RE.test(email.trim()) ? undefined : 'Enter a valid email address.';
};

export const validatePassword = (password: string): string | undefined => {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Include at least one letter and one number.';
  return undefined;
};

const compact = <K extends string>(errors: FieldErrors<K>): FieldErrors<K> =>
  Object.fromEntries(Object.entries(errors).filter(([, v]) => v)) as FieldErrors<K>;

export const validateLogin = (email: string, password: string) =>
  compact<'email' | 'password'>({
    email: validateEmail(email),
    password: password ? undefined : 'Password is required.',
  });

export const validateRegister = (v: { name: string; email: string; password: string; confirm: string; terms: boolean }) =>
  compact<'name' | 'email' | 'password' | 'confirm' | 'terms'>({
    terms: v.terms ? undefined : 'You must accept the terms to continue.',
    name: v.name.trim().length < 2 ? 'Enter your full name.' : v.name.trim().length > 60 ? 'Name is too long.' : undefined,
    email: validateEmail(v.email),
    password: validatePassword(v.password),
    confirm: v.confirm === v.password ? undefined : 'Passwords do not match.',
  });

export const validateProfile = (v: { name: string; email: string; phone: string; location: string; bio: string }) =>
  compact<'name' | 'email' | 'phone' | 'location' | 'bio'>({
    name: v.name.trim().length < 2 ? 'Name is required (at least 2 characters).' : v.name.trim().length > 60 ? 'Name is too long.' : undefined,
    email: validateEmail(v.email),
    phone: v.phone.trim() && !/^\+?[\d\s()-]{7,18}$/.test(v.phone.trim()) ? 'Enter a valid phone number.' : undefined,
    location: v.location.length > 60 ? 'Keep location under 60 characters.' : undefined,
    bio: v.bio.length > 240 ? `Bio is ${v.bio.length - 240} characters too long (max 240).` : undefined,
  });
