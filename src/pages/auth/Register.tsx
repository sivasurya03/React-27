import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button, Checkbox, Input, useToast } from '@/components/ui';
import { clearAuthError, register } from '@/features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { validateRegister, type FieldErrors } from '@/utils/validators';

export default function Register() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { status, error } = useAppSelector((state) => state.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [visible, setVisible] = useState(false);
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<'name' | 'email' | 'password' | 'confirm' | 'terms'>>({});

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const set = (key: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: event.target.value }));

  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const found = validateRegister({ ...form, terms });
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const result = await dispatch(register({ name: form.name, email: form.email, password: form.password }));
    if (register.fulfilled.match(result)) {
      toast.success('Account created', `Welcome to LearnSphere, ${result.payload.user.name.split(' ')[0]}!`);
      navigate('/', { replace: true });
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start learning in under a minute."
      footer={<>Already registered? <Link to="/login" className="font-medium text-brand-text hover:underline">Sign in</Link></>}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</p>}
        <Input label="Full name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} leftIcon={<User className="h-4 w-4" />} />
        <Input label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} leftIcon={<Mail className="h-4 w-4" />} />
        <Input
          label="Password"
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          hint="At least 8 characters with a letter and a number."
          leftIcon={<Lock className="h-4 w-4" />}
          rightSlot={
            <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Hide password' : 'Show password'} className="rounded-md p-1.5 text-muted hover:text-fg">
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
        <Input label="Confirm password" type={visible ? 'text' : 'password'} autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} leftIcon={<Lock className="h-4 w-4" />} />
        <div>
          <Checkbox label={<>I agree to the <span className="font-medium text-brand-text">Terms and Conditions</span> and Privacy Policy</>} checked={terms} onChange={(e) => setTerms(e.target.checked)} aria-invalid={errors.terms ? true : undefined} />
          {errors.terms && <p role="alert" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{errors.terms}</p>}
        </div>
        <Button type="submit" fullWidth size="lg" loading={status === 'loading'}>Create account</Button>
      </form>
    </AuthLayout>
  );
}
