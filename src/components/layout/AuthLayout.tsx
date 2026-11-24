import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { slideUp } from '@/utils/motion';

const HIGHLIGHTS = ['Expert-led courses across 10 categories', 'Track progress and earn certificates', 'Learn on any device, in light or dark mode'];

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-app lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-brand p-12 text-brand-fg lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10" aria-hidden />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/10" aria-hidden />
        <Link to="/" className="relative text-2xl font-bold tracking-tight">LearnSphere</Link>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight">Learn skills that move your career forward.</h2>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((text) => (
              <li key={text} className="flex items-center gap-3 text-white/90">
                <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/70">Trusted by learners, instructors and teams worldwide.</p>
      </aside>
      <main className="flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between lg:justify-end">
          <Link to="/" className="lg:hidden"><Logo /></Link>
          <ThemeToggle />
        </div>
        <motion.div variants={slideUp} initial="hidden" animate="visible" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
          <h1 className="text-3xl font-bold tracking-tight text-fg">{title}</h1>
          <p className="mt-2 text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
        </motion.div>
      </main>
    </div>
  );
}
