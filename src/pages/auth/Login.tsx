import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button, Checkbox, Input, useToast } from '@/components/ui';
import { clearAuthError, login } from '@/features/auth/authSlice';
import { DEMO_PASSWORD, demoAccounts } from '@/data/people';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { homeFor } from '@/utils/paths';
import { validateLogin, type FieldErrors } from '@/utils/validators';

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { status, error } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<FieldErrors<'email' | 'password'>>({});

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const found = validateLogin(email, password);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const result = await dispatch(login({ email, password, remember }));
    if (login.fulfilled.match(result)) {
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
      toast.success('Signed in', `Welcome back, ${result.payload.user.name.split(' ')[0]}!`);
      navigate(from && from !== '/login' ? from : homeFor(result.payload.user.role), { replace: true });
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue learning."
      footer={<>New to LearnSphere? <Link to="/register" className="font-medium text-brand-text hover:underline">Create an account</Link></>}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {error && (
          <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</p>
        )}
        <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} leftIcon={<Mail className="h-4 w-4" />} placeholder="you@example.com" />
        <Input
          label="Password"
          type={visible ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          leftIcon={<Lock className="h-4 w-4" />}
          placeholder="Your password"
          rightSlot={
            <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Hide password' : 'Show password'} className="rounded-md p-1.5 text-muted hover:text-fg">
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
        <div className="flex items-center justify-between gap-3">
          <Checkbox label="Remember me" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <Link to="/forgot-password" className="text-sm font-medium text-brand-text hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" fullWidth size="lg" loading={status === 'loading'}>Sign in</Button>
      </form>

      <div className="mt-8 rounded-2xl border border-dashed border-line p-4">
        <p className="text-sm font-medium text-fg">Demo accounts</p>
        <p className="mt-0.5 text-xs text-muted">Pick a role to fill the form (password: {DEMO_PASSWORD}).</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {demoAccounts.map((account) => (
            <Button key={account.id} size="sm" variant="outline" onClick={() => { setEmail(account.email); setPassword(DEMO_PASSWORD); setErrors({}); }}>
              {account.role[0].toUpperCase() + account.role.slice(1)}
            </Button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
