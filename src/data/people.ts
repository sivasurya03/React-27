import type { Instructor, Student, User } from '@/types';
import { courses } from './courses';
import { enrollments } from './enrollments';
import { daysAgo } from './time';
import { netPrice } from '@/utils/format';

const emailOf = (name: string): string =>
  `${name.toLowerCase().replace(/^dr\.\s*/, '').replace(/[^a-z\s]/g, '').trim().replace(/\s+/g, '.')}@learnsphere.demo`;

const INSTRUCTOR_RAW: [string, string, string][] = [
  ['i1', 'Dr. Meera Krishnan', 'AI researcher and educator with a decade of applied machine learning work in healthcare and fintech.'],
  ['i2', 'Arjun Venkatesh', 'Staff engineer who has shipped React and Node products to millions of users.'],
  ['i3', 'Priya Nair', 'Principal product designer who leads design systems for fast-growing SaaS teams.'],
  ['i4', 'Rahul Menon', 'Data scientist turned teacher, focused on making analytics approachable.'],
  ['i5', 'Sofia Alvarez', 'Growth marketer who has scaled acquisition for consumer and B2B brands.'],
  ['i6', 'Daniel Okafor', 'Former strategy consultant and product leader who also teaches personal finance.'],
  ['i7', 'Kavya Raman', 'Mobile and cloud engineer, AWS certified, and a community workshop host.'],
  ['i8', 'Marcus Chen', 'Award-winning portrait and street photographer based in Singapore.'],
];

export const instructors: Instructor[] = INSTRUCTOR_RAW.map(([id, name, bio], index) => {
  const own = courses.filter((c) => c.instructorId === id);
  const studentsCount = own.reduce((sum, c) => sum + c.studentsCount, 0);
  return {
    id,
    name,
    email: emailOf(name),
    avatar: '',
    joinedAt: daysAgo(420 + index * 55),
    bio,
    rating: Math.round((own.filter((c) => c.rating > 0).reduce((sum, c) => sum + c.rating, 0) / Math.max(1, own.filter((c) => c.rating > 0).length)) * 10) / 10,
    studentsCount,
    coursesCount: own.length,
    revenue: Math.round(own.reduce((sum, c) => sum + netPrice(c.price, c.discount) * c.studentsCount, 0)),
  };
});

/** name, total learning hours, streak in days */
const STUDENT_RAW: [string, number, number][] = [
  ['Sivasurya', 48, 12], ['Ishita Patel', 62, 21], ['Rohan Iyer', 27, 4], ['Ananya Reddy', 91, 33], ['Karthik Subramanian', 55, 9],
  ['Neha Gupta', 34, 6], ['Vikram Singh', 41, 15], ['Divya Lakshmi', 78, 27], ['Arjun Das', 19, 2], ['Sneha Kulkarni', 66, 18],
  ['Mohammed Faiz', 23, 5], ['Lakshmi Priya', 52, 11], ['Tanvir Hossain', 30, 7], ['Emily Carter', 44, 14], ['Lucas Martins', 12, 1],
];

export const students: Student[] = STUDENT_RAW.map(([name, learningHours, streak], i) => {
  const id = `s${i + 1}`;
  const own = enrollments.filter((e) => e.studentId === id);
  return {
    id,
    name,
    email: emailOf(name),
    avatar: '',
    joinedAt: daysAgo(40 + i * 23),
    coursesEnrolled: own.length,
    coursesCompleted: own.filter((e) => e.status === 'completed').length,
    learningHours,
    streak,
  };
});

/** Demo sign-in accounts. Password for all: Demo@123 */
export const DEMO_PASSWORD = 'Demo@123';
export const demoAccounts: User[] = [
  { id: 's1', name: 'Sivasurya', email: 'student@learnsphere.demo', role: 'student', phone: '+91 98765 43210', bio: 'Front-end learner building real projects.', location: 'Chennai, India', createdAt: daysAgo(160) },
  { id: 'i2', name: 'Arjun Venkatesh', email: 'instructor@learnsphere.demo', role: 'instructor', phone: '+91 90000 11122', bio: INSTRUCTOR_RAW[1][2], location: 'Bengaluru, India', createdAt: daysAgo(540) },
  { id: 'a1', name: 'Anita Rao', email: 'admin@learnsphere.demo', role: 'admin', phone: '+91 90000 33344', bio: 'Platform operations lead.', location: 'Hyderabad, India', createdAt: daysAgo(700) },
];
