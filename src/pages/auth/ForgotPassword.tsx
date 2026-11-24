import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button, Input } from '@/components/ui';
import { authService } from '@/services/authService';
import { toErrorMessage } from '@/utils/errors';
import { validateEmail } from '@/utils/validators';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const problem = validateEmail(email);
    setError(problem);
    if (problem) return;
    setLoading(true);
    try {
      const result = await authService.requestPasswordReset(email);
      setSentTo(result.email);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we will send reset instructions."
      footer={<Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-brand-text hover:underline"><ArrowLeft className="h-4 w-4" />Back to sign in</Link>}
    >
      {sentTo ? (
        <div role="status" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400" aria-hidden />
          <p className="mt-3 font-semibold text-fg">Check your inbox</p>
          <p className="mt-1 text-sm text-muted">If an account exists for {sentTo}, a reset link is on its way. This is a demo, so no email is actually sent.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} leftIcon={<Mail className="h-4 w-4" />} />
          <Button type="submit" fullWidth size="lg" loading={loading}>Send reset link</Button>
        </form>
      )}
    </AuthLayout>
  );
}
