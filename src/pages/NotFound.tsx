import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { Button, buttonStyles } from '@/components/ui';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { scaleIn } from '@/utils/motion';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col bg-app px-4">
      <div className="flex justify-end py-4"><ThemeToggle /></div>
      <motion.div variants={scaleIn} initial="hidden" animate="visible" className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand/10 text-brand-text"><Compass className="h-10 w-10" aria-hidden /></span>
        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-brand-text">Error 404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-fg sm:text-4xl">We could not find that page</h1>
        <p className="mt-3 text-muted">The link may be broken or the page may have moved. Let us get you back on track.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>
          <Link to="/" className={buttonStyles('primary')}>Go to home</Link>
        </div>
      </motion.div>
    </div>
  );
}
