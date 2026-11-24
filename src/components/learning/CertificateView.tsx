import { Award } from 'lucide-react';
import type { CertificateRecord } from '@/types';
import { formatDate } from '@/utils/format';

/** Styled as a paper certificate: intentionally the same light "paper" look in both themes (and on print). */
export function CertificateView({ record }: { record: CertificateRecord }) {
  return (
    <div className="print-area rounded-xl border-4 border-double border-amber-700/60 bg-amber-50 p-6 text-center text-stone-800 sm:p-10">
      <Award className="mx-auto h-10 w-10 text-amber-700" aria-hidden />
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-800">LearnSphere</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">Certificate of Completion</h2>
      <p className="mt-6 text-sm text-stone-600">This certifies that</p>
      <p className="mt-1 break-words text-2xl font-semibold text-stone-900 sm:text-3xl">{record.studentName}</p>
      <p className="mt-4 text-sm text-stone-600">has successfully completed the course</p>
      <p className="mt-1 break-words text-lg font-semibold text-stone-900 sm:text-xl">{record.courseTitle}</p>
      <dl className="mt-8 grid grid-cols-2 gap-4 text-left text-xs sm:grid-cols-4">
        <div><dt className="text-stone-500">Instructor</dt><dd className="mt-0.5 font-medium text-stone-900">{record.instructorName}</dd></div>
        <div><dt className="text-stone-500">Completed</dt><dd className="mt-0.5 font-medium text-stone-900">{formatDate(record.completedAt)}</dd></div>
        <div><dt className="text-stone-500">Duration</dt><dd className="mt-0.5 font-medium text-stone-900">{record.durationHours} hours</dd></div>
        <div><dt className="text-stone-500">Certificate ID</dt><dd className="mt-0.5 break-all font-mono font-medium text-stone-900">{record.id}</dd></div>
      </dl>
      <p className="mt-6 text-[11px] text-stone-500">Demo certificate generated in the browser. It is not independently verified.</p>
    </div>
  );
}
