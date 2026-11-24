import { Avatar, Badge, Drawer, ProgressBar, type BadgeVariant } from '@/components/ui';
import type { Course, Enrollment, Student } from '@/types';
import { timeAgo } from '@/utils/format';
import { studentCourseDetail, type AssignmentState } from '@/utils/instructorInsights';

const ASSIGNMENT_VARIANT: Record<AssignmentState, BadgeVariant> = { 'Not started': 'neutral', 'In progress': 'info', Submitted: 'warning', Reviewed: 'success' };

interface LearningLike {
  completedLessons: Record<string, string[]>;
  quizResults: Record<string, { percentage: number }>;
  assignments: Record<string, { status: string }>;
}

interface Props {
  student: Student | undefined;
  enrollments: Enrollment[];
  courses: Course[];
  learning: LearningLike;
  realStudentId: string;
  onClose: () => void;
}

export function StudentDetailDrawer({ student, enrollments, courses, learning, realStudentId, onClose }: Props) {
  const details = enrollments.flatMap((e) => {
    const course = courses.find((c) => c.id === e.courseId);
    return course ? [{ enrollment: e, course, detail: studentCourseDetail(e, course, learning, realStudentId) }] : [];
  });
  const avgProgress = details.length ? Math.round(details.reduce((s, d) => s + d.enrollment.progress, 0) / details.length) : 0;
  const scores = details.map((d) => d.detail.quizScore).filter((s): s is number => s !== null);
  const avgQuiz = scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null;

  return (
    <Drawer open={Boolean(student)} onClose={onClose} title="Student details" side="right">
      {student && (
        <div className="space-y-6 p-4">
          <div className="flex items-center gap-3">
            <Avatar name={student.name} src={student.avatar} size="lg" />
            <div className="min-w-0"><p className="truncate text-lg font-semibold text-fg">{student.name}</p><p className="truncate text-sm text-muted">{student.email}</p></div>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[['Your courses', String(details.length)], ['Completed', String(details.filter((d) => d.enrollment.status === 'completed').length)], ['Avg. progress', `${avgProgress}%`], ['Avg. quiz score', avgQuiz === null ? 'No attempts' : `${avgQuiz}%`], ['Learning hours', String(student.learningHours)], ['Day streak', String(student.streak)]].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-subtle p-3"><dt className="text-xs text-muted">{label}</dt><dd className="mt-0.5 font-semibold text-fg">{value}</dd></div>
            ))}
          </dl>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-fg">Enrolled courses</h3>
            <ul className="space-y-4">
              {details.map(({ enrollment, course, detail }) => (
                <li key={enrollment.id} className="rounded-xl border border-line p-3">
                  <p className="text-sm font-medium text-fg">{course.title}</p>
                  <div className="mt-2"><ProgressBar value={enrollment.progress} showLabel size="sm" tone={enrollment.status === 'completed' ? 'success' : 'brand'} label={`${course.title} progress`} /></div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div><dt className="text-muted">Lessons</dt><dd className="text-fg">{detail.completedLessons} of {detail.totalLessons} completed</dd></div>
                    <div><dt className="text-muted">Quiz score</dt><dd className="text-fg">{detail.quizScore === null ? 'No attempts' : `${detail.quizScore}%`}</dd></div>
                    <div><dt className="text-muted">Assignment</dt><dd><Badge variant={ASSIGNMENT_VARIANT[detail.assignment]}>{detail.assignment}</Badge></dd></div>
                    <div><dt className="text-muted">Last activity</dt><dd className="text-fg">{timeAgo(enrollment.lastAccessedAt)}</dd></div>
                  </dl>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted">Detailed metrics are demo data, except for the demo student whose learning is tracked live.</p>
          </div>
        </div>
      )}
    </Drawer>
  );
}
