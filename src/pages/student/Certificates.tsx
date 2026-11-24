import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, CalendarCheck, Copy, Fingerprint, Printer } from 'lucide-react';
import { CourseThumbnail } from '@/components/common/CourseThumbnail';
import { CertificateView } from '@/components/learning/CertificateView';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, Button, buttonStyles, Card, CardHeader, EmptyState, Modal, ProgressBar, Skeleton, useToast } from '@/components/ui';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentUser, selectMyEnrollments } from '@/store/selectors';
import { formatDate } from '@/utils/format';
import { slideUp, staggerChildren } from '@/utils/motion';

export default function Certificates() {
  const user = useAppSelector(selectCurrentUser);
  const toast = useToast();
  const { items, status } = useAppSelector((state) => state.courses);
  const enrollments = useAppSelector(selectMyEnrollments);
  const records = useAppSelector((state) => state.learning.certificates);
  const [params, setParams] = useSearchParams();

  const courseById = useMemo(() => new Map(items.map((c) => [c.id, c])), [items]);
  /** A certificate is shown while its course is still completed. */
  const earned = useMemo(
    () => records.filter((r) => r.studentId === user?.id && enrollments.some((e) => e.courseId === r.courseId && e.status === 'completed')),
    [records, user?.id, enrollments],
  );
  const almost = useMemo(
    () => enrollments.filter((e) => e.status === 'in-progress' && e.progress >= 50).flatMap((enrollment) => { const course = courseById.get(enrollment.courseId); return course ? [{ course, enrollment }] : []; }),
    [enrollments, courseById],
  );
  const selected = earned.find((r) => r.courseId === params.get('view'));

  const copyId = (id: string): void => {
    void navigator.clipboard?.writeText(id).then(() => toast.success('Certificate ID copied'), () => toast.error('Could not copy the ID'));
  };

  return (
    <>
      <PageHeader title="Certificates" description="Proof of the skills you have completed." />
      {status !== 'succeeded' ? (
        <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-44 rounded-2xl" /><Skeleton className="h-44 rounded-2xl" /></div>
      ) : earned.length === 0 ? (
        <Card><EmptyState icon={Award} title="No certificates yet" description="Certificates appear here after you complete every lesson in a course." action={<Link to="/my-learning" className={buttonStyles('primary')}>Go to My Learning</Link>} /></Card>
      ) : (
        <motion.ul variants={staggerChildren} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {earned.map((record) => (
            <motion.li key={record.id} variants={slideUp}>
              <Card padded={false} hoverable className="flex h-full flex-col overflow-hidden">
                {courseById.get(record.courseId) && <CourseThumbnail src={courseById.get(record.courseId)?.thumbnail ?? ''} alt="" className="aspect-[16/7] w-full" />}
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <Badge variant="success" className="self-start">Completed</Badge>
                  <h3 className="font-semibold leading-snug text-fg">{record.courseTitle}</h3>
                  <dl className="space-y-1.5 text-sm text-muted">
                    <div className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 shrink-0" aria-hidden /><dt className="sr-only">Completed on</dt><dd>{formatDate(record.completedAt)}</dd></div>
                    <div className="flex items-center gap-2"><Fingerprint className="h-4 w-4 shrink-0" aria-hidden /><dt className="sr-only">Certificate ID</dt><dd className="truncate font-mono text-xs">{record.id}</dd></div>
                  </dl>
                  <Button className="mt-auto" variant="outline" onClick={() => setParams({ view: record.courseId })}>View Certificate</Button>
                </div>
              </Card>
            </motion.li>
          ))}
        </motion.ul>
      )}

      {almost.length > 0 && (
        <Card className="mt-8">
          <CardHeader title="Almost there" subtitle="Courses that are more than halfway to a certificate" />
          <ul className="space-y-4">
            {almost.map(({ course, enrollment }) => (
              <li key={enrollment.id} className="grid gap-2 sm:grid-cols-[1fr_16rem] sm:items-center">
                <span className="truncate text-sm font-medium text-fg">{course.title}</span>
                <ProgressBar value={enrollment.progress} showLabel size="sm" label={`${course.title} progress`} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setParams({})}
        size="lg"
        title="Your certificate"
        description="Demo certificate generated in your browser."
        footer={selected && <><Button variant="outline" leftIcon={<Copy className="h-4 w-4" />} onClick={() => copyId(selected.id)}>Copy ID</Button><Button leftIcon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>Print / Save as PDF</Button></>}
      >
        {selected && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>
            <CertificateView record={selected} />
          </motion.div>
        )}
      </Modal>
    </>
  );
}
