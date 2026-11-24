/**
 * Logic and data-integrity tests that do not need a browser, React or Redux.
 * Run with: npm test
 */
const store = new Map<string, string>();
const storage = { getItem: (k: string) => (store.has(k) ? store.get(k)! : null), setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
Object.assign(globalThis, {
  window: { localStorage: storage, sessionStorage: { ...storage, getItem: () => null, setItem: () => undefined, removeItem: () => undefined }, matchMedia: () => ({ matches: false }) },
});

import { courses } from '@/data/courses';
import { enrollments } from '@/data/enrollments';
import { students, instructors, demoAccounts } from '@/data/people';
import { reviews } from '@/data/reviews';
import { notifications, instructorNotifications, adminNotifications } from '@/data/notifications';
import { curriculumByCourse } from '@/data/curriculum';
import { assignmentBrief, quizFor, resourcesFor, PASS_MARK } from '@/data/learningContent';
import { courseProgress, isLocked, resumeLesson, neighbours, flat, buildUpcoming, certificateId } from '@/utils/learning';
import { buildCourse, duplicateCourse, emptyDraft, firstPublishBlocker, newChapter, newLesson, validateBasics, validateCurriculum, validatePricing, validateQuiz } from '@/utils/courseBuilder';
import { buildAnalytics, buildEarnings, buildSeries } from '@/services/instructorAnalytics';
import { buildEnrollmentRows, buildTransactions, withLiveActivity } from '@/utils/adminInsights';
import { buildReport } from '@/utils/adminReports';
import { courseDb } from '@/services/courseDb';
import { adminDb } from '@/services/adminDb';
import { authService } from '@/services/authService';
import { validateEmail, validatePassword, validateProfile, validateRegister } from '@/utils/validators';
import { adminService } from '@/services/adminService';
import { instructorService } from '@/services/instructorService';

let passed = 0; const failures: string[] = [];
const check = (name: string, ok: boolean, detail = ''): void => { if (ok) passed += 1; else failures.push(`${name}${detail ? ` -> ${detail}` : ''}`); };
const dupes = (ids: string[]): string[] => ids.filter((id, i) => ids.indexOf(id) !== i);

async function main(): Promise<void> {
  // data integrity
  check('unique course ids', dupes(courses.map((c) => c.id)).length === 0);
  check('unique enrollment ids', dupes(enrollments.map((e) => e.id)).length === 0);
  check('unique student ids', dupes(students.map((s) => s.id)).length === 0);
  check('unique review ids', dupes(reviews.map((r) => r.id)).length === 0);
  check('unique notification ids', dupes([...notifications, ...instructorNotifications, ...adminNotifications].map((n) => n.id)).length === 0);
  const allLessons = Object.values(curriculumByCourse).flatMap((chs) => chs.flatMap((c) => c.lessons));
  check('unique lesson ids', dupes(allLessons.map((l) => l.id)).length === 0);
  check('unique chapter ids', dupes(Object.values(curriculumByCourse).flatMap((chs) => chs.map((c) => c.id))).length === 0);
  for (const c of courses) {
    check(`course ${c.id} instructor exists`, instructors.some((i) => i.id === c.instructorId));
    check(`course ${c.id} has curriculum`, (curriculumByCourse[c.id] ?? []).length > 0);
    check(`course ${c.id} lessonsCount matches`, c.lessonsCount === flat(curriculumByCourse[c.id] ?? []).length);
    check(`course ${c.id} thumbnail is a data URI`, c.thumbnail.startsWith('data:image/svg+xml'));
    check(`course ${c.id} price/discount sane`, c.price >= 0 && c.discount >= 0 && c.discount <= 90);
    check(`course ${c.id} rating sane`, c.rating >= 0 && c.rating <= 5);
  }
  for (const e of enrollments) {
    check(`enrollment ${e.id} refs`, students.some((s) => s.id === e.studentId) && courses.some((c) => c.id === e.courseId));
    check(`enrollment ${e.id} progress`, e.progress >= 0 && e.progress <= 100);
  }
  for (const r of reviews) check(`review ${r.id} refs`, students.some((s) => s.id === r.studentId) && courses.some((c) => c.id === r.courseId) && r.rating >= 1 && r.rating <= 5);
  for (const course of courses) {
    for (const lesson of flat(curriculumByCourse[course.id])) {
      if (lesson.type === 'quiz') {
        const qs = quizFor(course.id, lesson.id);
        check(`quiz ${lesson.id} has questions`, qs.length > 0 || course.status !== 'published');
        qs.forEach((q) => check(`quiz ${q.id} correctIndex valid`, q.correctIndex >= 0 && q.correctIndex < q.options.length && q.options.length >= 2));
      }
      if (lesson.type === 'assignment') check(`assignment ${lesson.id} brief`, assignmentBrief(course.id, lesson.id).instructions.length > 0);
    }
    check(`resources for ${course.id}`, resourcesFor(course.id, course.title).length > 0);
  }
  check('demo accounts exist for all roles', ['student', 'instructor', 'admin'].every((r) => demoAccounts.some((a) => a.role === r)));
  check('every instructor has joinedAt', instructors.every((i) => Boolean(i.joinedAt)));
  check('pass mark', PASS_MARK === 70);

  // learning logic
  const react = curriculumByCourse.c1;
  const ids = flat(react).map((l) => l.id);
  check('progress 0%', courseProgress(react, []) === 0);
  check('progress 100%', courseProgress(react, ids) === 100);
  check('progress partial', courseProgress(react, ids.slice(0, 3)) === Math.round((3 / ids.length) * 100));
  const quiz = flat(react).find((l) => l.type === 'quiz')!;
  check('quiz locked until earlier lessons done', isLocked(react, quiz, []) === true);
  const before = flat(react).filter((l) => l.chapterId === quiz.chapterId && l.type !== 'quiz' && l.type !== 'assignment').map((l) => l.id);
  check('quiz unlocked once earlier lessons done', isLocked(react, quiz, before) === false);
  check('resume = first open lesson', resumeLesson(react, [])?.id === ids[0]);
  check('resume skips completed', resumeLesson(react, ids.slice(0, 2))?.id === ids[2]);
  check('resume when all done = first lesson', resumeLesson(react, ids)?.id === ids[0]);
  check('neighbours', neighbours(react, ids[1]).prev?.id === ids[0] && neighbours(react, ids[1]).next?.id === ids[2] && neighbours(react, ids[0]).prev === undefined);
  check('certificate id format', /^LS-\d{4}-C1-S1$/.test(certificateId('c1', 's1', '2026-05-01T00:00:00Z')));
  check('upcoming picks quizzes/assignments', buildUpcoming(['c1'], { c1: 'React' }, {}).every((a) => a.kind === 'quiz' || a.kind === 'assignment'));

  // course builder
  const draft = emptyDraft();
  check('empty draft invalid', Object.keys(validateBasics(draft)).length === 4 && firstPublishBlocker(draft)?.step === 0);
  draft.title = 'Valid course title'; draft.description = 'A sufficiently long description for this course, over forty characters.'; draft.category = 'Web Development'; draft.level = 'Beginner';
  check('basics valid', Object.keys(validateBasics(draft)).length === 0);
  draft.price = '50'; draft.discountPrice = '60';
  check('discount must be lower than price', Boolean(validatePricing(draft).discountPrice));
  draft.discountPrice = '40';
  check('pricing valid', Object.keys(validatePricing(draft)).length === 0);
  check('no curriculum blocks publish', firstPublishBlocker(draft)?.step === 3);
  const ch = newChapter('cx', 'Intro'); const lesson = newLesson('cx', ch.id, 'video', 'Welcome'); ch.lessons.push(lesson); draft.chapters = [ch];
  check('curriculum valid', validateCurriculum(draft) === undefined && firstPublishBlocker(draft) === null);
  const q = newLesson('cx', ch.id, 'quiz', 'Quiz'); ch.lessons.push(q);
  check('quiz without questions invalid', Boolean(validateCurriculum(draft)));
  draft.content[q.id] = { quiz: [{ id: 'q1', prompt: 'Q?', options: ['a', 'b'], correctIndex: 1 }] };
  check('quiz with questions valid', validateCurriculum(draft) === undefined && validateQuiz(draft.content[q.id].quiz) === undefined);
  const built = buildCourse(draft, 'cx', 'i2', 'draft');
  check('buildCourse discount %', built.discount === 20 && built.lessonsCount === 2 && built.status === 'draft' && built.thumbnail.startsWith('data:image'));
  const dup = duplicateCourse(built, [ch], draft.content, 'i2');
  check('duplicate gets new ids and draft status', dup.course.id !== built.id && dup.course.status === 'draft' && dup.chapters[0].id !== ch.id && dup.chapters[0].lessons[1].id !== q.id && Object.keys(dup.content).length === 1);

  // validators
  check('email validation', validateEmail('a@b.co') === undefined && Boolean(validateEmail('nope')));
  check('password validation', validatePassword('abc12345') === undefined && Boolean(validatePassword('short1')) && Boolean(validatePassword('allletters')));
  check('register validation', Object.keys(validateRegister({ name: 'Al', email: 'a@b.co', password: 'abc12345', confirm: 'abc12345', terms: true })).length === 0 && Boolean(validateRegister({ name: 'Al', email: 'a@b.co', password: 'abc12345', confirm: 'abc12345', terms: false }).terms));
  check('profile validation', Boolean(validateProfile({ name: 'Al', email: 'a@b.co', phone: 'abc', location: '', bio: '' }).phone));

  // analytics
  const live = courses.filter((c) => c.studentsCount > 0);
  const totalEnr = live.reduce((s, c) => s + c.studentsCount, 0);
  const y1 = buildSeries('y1', live, 7);
  check('y1 series has 12 points', y1.length === 12);
  check('y1 enrollments sum ~ lifetime', Math.abs(y1.reduce((s, p) => s + p.enrollments, 0) - totalEnr) <= live.length * 12);
  check('period lengths', buildSeries('d7', live, 1).length === 7 && buildSeries('d30', live, 1).length === 30 && buildSeries('d90', live, 1).length === 13);
  check('series deterministic', JSON.stringify(buildSeries('d30', live, 5)) === JSON.stringify(buildSeries('d30', live, 5)));
  const an = buildAnalytics(live, 'd30', 'all', []);
  check('analytics totals', an.totals.enrollments > 0 && an.totals.revenue > 0 && an.performance.length === live.length);
  const one = buildAnalytics(live, 'y1', 'c1', ['A', 'B', 'C']);
  check('single-course engagement per chapter', one.engagement.length === 3 && one.engagement.every((e) => e.value >= 0 && e.value <= 100));
  const earn = buildEarnings(live.filter((c) => c.instructorId === 'i2'));
  check('earnings summary', earn.summary.total > 0 && earn.monthly.length === 12 && earn.transactions.length === 64 && earn.transactions.every((t) => t.net >= 0));
  check('no earnings without courses', buildEarnings([]).transactions.length === 0);

  // admin insights / reports
  const rows = buildEnrollmentRows(enrollments, courses, students, instructors, Date.parse('2026-11-16T12:00:00Z'));
  check('enrollment rows join all', rows.length === enrollments.length);
  const refunded = buildEnrollmentRows([{ ...enrollments[0], adminStatus: 'refunded' }], courses, students, instructors)[0];
  check('refund status propagates', refunded.completion === 'refunded' && refunded.payment === 'refunded');
  const tx = buildTransactions(rows);
  check('transactions fee math', tx.every((t) => Math.abs(t.fee + t.instructorEarnings - t.gross) < 0.02));
  const stats = await adminService.getStats();
  const withLive = withLiveActivity(stats, rows, students);
  check('admin stats consistent', stats.totals.courses === courseDb.courses().length && withLive.totals.revenue >= stats.totals.revenue && stats.revenueSeries.length === 12);
  for (const type of ['students', 'courses', 'instructors', 'revenue'] as const) {
    const report = buildReport(type, { from: '', to: '', category: 'all' }, { students, instructors, courses, rows, transactions: tx });
    check(`report ${type} builds`, report.rows.length > 0 && report.summary.length === 4 && report.rows.every((r) => r.length === report.headers.length));
  }
  check('report date range filters', buildReport('revenue', { from: '2030-01-01', to: '2030-02-01', category: 'all' }, { students, instructors, courses, rows, transactions: tx }).rows.length === 0);
  const analytics = await adminService.getAnalytics('d90');
  check('admin analytics', analytics.points.length === 13 && analytics.category.length === 10 && analytics.instructors.length === instructors.length);
  const dash = await instructorService.getDashboard('i2');
  check('instructor dashboard kpis', dash.kpis.totalCourses === courseDb.courses().filter((c) => c.instructorId === 'i2').length && dash.kpis.published >= 1 && dash.enrollmentTrend.length === 12);

  // mock database
  const startCount = courseDb.courses().length;
  const saved = courseDb.save({ ...built, id: 'c-test' }, [ch], draft.content);
  check('db save adds course', courseDb.courses().length === startCount + 1 && saved.updatedAt !== undefined && courseDb.curricula()['c-test'].length === 1 && Boolean(courseDb.lessonContent()[q.id]));
  courseDb.patch({ ...saved, title: 'Patched title' });
  check('patch keeps curriculum + lesson content', courseDb.courses().find((c) => c.id === 'c-test')?.title === 'Patched title' && Boolean(courseDb.lessonContent()[q.id]) && courseDb.curricula()['c-test'].length === 1);
  check('setStatus rejected stores reason', courseDb.setStatus('c-test', 'rejected', 'Needs work').rejectionReason === 'Needs work' && courseDb.setStatus('c-test', 'pending').rejectionReason === undefined);
  courseDb.remove('c-test');
  check('db remove', courseDb.courses().length === startCount && courseDb.curricula()['c-test'] === undefined);
  check('seed includes pending + rejected demo courses', courseDb.courses().some((c) => c.status === 'pending') && courseDb.courses().some((c) => c.status === 'rejected'));

  // auth service rules
  const ok = await authService.login('student@learnsphere.demo', 'Demo@123');
  check('demo login works', ok.user.role === 'student');
  const bad = await authService.login('student@learnsphere.demo', 'wrong').then(() => 'no error', (e: Error) => e.message);
  check('wrong password rejected', bad === 'Invalid email or password.');
  const reg = await authService.register({ name: 'Test User', email: 'test.user@example.com', password: 'abc12345' });
  check('register creates a student', reg.user.role === 'student' && adminDb.registeredStudents().some((u) => u.id === reg.user.id));
  const dupReg = await authService.register({ name: 'Test User', email: 'TEST.user@example.com', password: 'abc12345' }).then(() => 'no error', (e: Error) => e.message);
  check('duplicate email rejected', dupReg.includes('already exists'));
  adminDb.patchStudent(reg.user.id, { status: 'suspended' });
  const susp = await authService.login('test.user@example.com', 'abc12345').then(() => 'no error', (e: Error) => e.message);
  check('suspended student cannot log in', susp.includes('suspended'));
  adminDb.patchStudent(reg.user.id, { status: 'active' });
  check('reactivated student can log in', (await authService.login('test.user@example.com', 'abc12345')).user.id === reg.user.id);
  adminDb.saveSettings({ ...adminDb.settings(), allowRegistrations: false });
  const closed = await authService.register({ name: 'Another', email: 'another@example.com', password: 'abc12345' }).then(() => 'no error', (e: Error) => e.message);
  check('registrations can be closed', closed.includes('closed'));
  adminDb.saveSettings({ ...adminDb.settings(), allowRegistrations: true, maintenanceMode: true });
  const maint = await authService.login('student@learnsphere.demo', 'Demo@123').then(() => 'no error', (e: Error) => e.message);
  const adminOk = await authService.login('admin@learnsphere.demo', 'Demo@123');
  check('maintenance blocks non-admins only', maint.includes('maintenance') && adminOk.user.role === 'admin');
  adminDb.saveSettings({ ...adminDb.settings(), maintenanceMode: false });
  const pw = await authService.changePassword(reg.user.id, 'abc12345', 'newpass123');
  check('registered users can change password', pw.persisted === true && (await authService.login('test.user@example.com', 'newpass123')).user.id === reg.user.id);

  console.log(`PASSED ${passed} checks, FAILED ${failures.length}`);
  failures.forEach((f) => console.log('  FAIL:', f));
  process.exit(failures.length ? 1 : 0);
}
void main();
