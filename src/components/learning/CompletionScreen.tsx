import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { buttonStyles, Button, Card } from '@/components/ui';

export function CompletionScreen({ courseTitle, certificateHref, onReview }: { courseTitle: string; certificateHref: string; onReview: () => void }) {
  return (
    <Card className="mx-auto max-w-2xl py-10 text-center">
      <motion.p initial={{ scale: 0.3, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="text-6xl" aria-hidden>🎉</motion.p>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-fg">Congratulations!</h2>
        <p className="mt-3 text-muted">You have successfully completed</p>
        <p className="mt-1 text-xl font-semibold text-fg">{courseTitle}</p>
        <p className="mt-3 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">100% complete</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={certificateHref} className={buttonStyles('primary', 'lg')}>View Certificate</Link>
          <Button size="lg" variant="outline" onClick={onReview}>Review Course</Button>
          <Link to="/courses" className={buttonStyles('ghost', 'lg')}>Explore More Courses</Link>
        </div>
      </motion.div>
    </Card>
  );
}
