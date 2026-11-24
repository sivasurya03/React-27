import type { AccountStatus, Student } from '@/types';
import { students as seedStudents } from '@/data/people';
import { adminDb } from './adminDb';
import { mockRequest } from './mock';

function merged(): Student[] {
  const overrides = adminDb.students();
  const registered: Student[] = adminDb.registeredStudents().map((u) => ({
    id: u.id, name: u.name, email: u.email, avatar: u.avatar ?? '', coursesEnrolled: 0, coursesCompleted: 0, learningHours: 0, streak: 0, joinedAt: u.createdAt,
  }));
  return [...seedStudents, ...registered.filter((r) => !seedStudents.some((s) => s.id === r.id))].map((s) => {
    const o = overrides[s.id];
    return { ...s, name: o?.name ?? s.name, email: o?.email ?? s.email, status: (o?.status as AccountStatus | undefined) ?? 'active' };
  });
}

export const studentService = {
  getStudents: (): Promise<Student[]> => mockRequest(merged),
  updateStudent: (id: string, patch: { name: string; email: string }): Promise<Student> =>
    mockRequest(() => {
      adminDb.patchStudent(id, patch);
      const student = merged().find((s) => s.id === id);
      if (!student) throw new Error('Student not found.');
      return student;
    }, 400),
  setStatus: (id: string, status: AccountStatus): Promise<Student> =>
    mockRequest(() => {
      adminDb.patchStudent(id, { status });
      const student = merged().find((s) => s.id === id);
      if (!student) throw new Error('Student not found.');
      return student;
    }, 400),
};
