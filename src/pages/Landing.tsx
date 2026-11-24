import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, BarChart3, BookOpen, MonitorPlay, ShieldCheck, Users } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Card, buttonStyles } from '@/components/ui';
import { slideUp, staggerChildren } from '@/utils/motion';

const FEATURES = [
  { icon: MonitorPlay, title: 'Immersive video learning', text: 'A focused player with curriculum, notes and resources side by side.' },
  { icon: BarChart3, title: 'Progress you can see', text: 'Streaks, learning hours and course progress tracked automatically.' },
  { icon: Award, title: 'Verified certificates', text: 'Complete a course and share a professional certificate.' },
  { icon: Users, title: 'Built for instructors', text: 'Create courses, build curriculum and follow student outcomes.' },
  { icon: ShieldCheck, title: 'Admin-grade control', text: 'Manage students, instructors, courses and revenue in one place.' },
  { icon: BookOpen, title: 'Every skill, one catalogue', text: 'From web development to photography and finance.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-app">
      <header className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className={buttonStyles('ghost')}>Sign in</Link>
          <Link to="/register" className={`${buttonStyles('primary')} hidden sm:inline-flex`}>Get started</Link>
        </div>
      </header>
      <main>
        <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:py-24">
          <motion.div variants={staggerChildren} initial="hidden" animate="visible">
            <motion.p variants={slideUp} className="text-sm font-semibold uppercase tracking-widest text-brand-text">Online learning platform</motion.p>
            <motion.h1 variants={slideUp} className="mt-4 text-4xl font-bold tracking-tight text-fg sm:text-6xl">Learn what matters, at your own pace.</motion.h1>
            <motion.p variants={slideUp} className="mx-auto mt-6 max-w-2xl text-lg text-muted">LearnSphere brings expert-led courses, structured progress tracking and certificates together in one polished experience.</motion.p>
            <motion.div variants={slideUp} className="mt-10 flex flex-wrap justify-center gap-3">
              <Link to="/register" className={buttonStyles('primary', 'lg')}>Start learning free</Link>
              <Link to="/login" className={buttonStyles('outline', 'lg')}>Try a demo account</Link>
            </motion.div>
          </motion.div>
        </section>
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <motion.ul variants={staggerChildren} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <motion.li key={title} variants={slideUp}>
                <Card hoverable className="h-full">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand-text"><Icon className="h-5 w-5" aria-hidden /></span>
                  <h2 className="mt-4 font-semibold text-fg">{title}</h2>
                  <p className="mt-1 text-sm text-muted">{text}</p>
                </Card>
              </motion.li>
            ))}
          </motion.ul>
        </section>
      </main>
      <footer className="border-t border-line py-8 text-center text-sm text-muted">© 2026 LearnSphere. Demo learning platform.</footer>
    </div>
  );
}
