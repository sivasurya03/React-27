import type { AppNotification, NotificationType } from '@/types';
import { daysAgo } from './time';

/** type, title, message, read, hours ago */
const RAW: [NotificationType, string, string, boolean, number][] = [
  ['course-update', 'New lessons added', 'Modern React & TypeScript Masterclass has a new chapter on testing patterns.', false, 3],
  ['assignment', 'Assignment due soon', 'Build a task board app is due in 2 days.', false, 9],
  ['quiz', 'Quiz result available', 'You scored 90% on the Heuristics quiz. Nicely done!', false, 20],
  ['recommendation', 'Recommended for you', 'Generative AI for Developers matches your recent learning.', true, 30],
  ['certificate', 'Certificate earned', 'Congratulations! Your UI/UX Design Fundamentals certificate is ready.', false, 52],
  ['announcement', 'Message from your instructor', 'Dr. Krishnan posted a live Q&A schedule for next week.', true, 70],
  ['system', 'Welcome to LearnSphere', 'Explore courses, track progress and earn certificates.', true, 120],
  ['course-update', 'Resources updated', 'Machine Learning A-Z now includes refreshed datasets.', true, 150],
  ['assignment', 'Assignment reviewed', 'Your submission for Analyse a public dataset has feedback.', true, 200],
  ['system', 'Profile tip', 'Add a short bio so instructors can personalise feedback.', true, 260],
];

const INSTRUCTOR_RAW: [NotificationType, string, string, boolean, number][] = [
  ['course-update', 'New student enrolled', 'Ishita Patel enrolled in Modern React & TypeScript Masterclass.', false, 2],
  ['assignment', 'Assignment submitted', 'Rohan Iyer submitted “Build a task board app”.', false, 6],
  ['announcement', 'New review received', 'Ananya Reddy left a 5-star review on Full-Stack Web Development with Node.', false, 14],
  ['system', 'Payment update', 'Your October payout of $4,820 has been processed (demo).', true, 50],
  ['course-update', 'Course published', 'Web Performance & Core Web Vitals is now live for students.', true, 120],
  ['system', 'Platform update', 'New analytics filters are now available in your dashboard.', true, 200],
];

export const notifications: AppNotification[] = RAW.map(([type, title, message, read, hours], i) => ({
  id: `n${i + 1}`,
  type,
  title,
  message,
  read,
  createdAt: daysAgo(0, hours),
}));

export const instructorNotifications: AppNotification[] = INSTRUCTOR_RAW.map(([type, title, message, read, hours], i) => ({
  id: `in${i + 1}`,
  type,
  title,
  message,
  read,
  createdAt: daysAgo(0, hours),
  audience: 'instructor' as const,
}));

const ADMIN_RAW: [NotificationType, string, string, boolean, number][] = [
  ['course-update', 'Course submitted for review', 'Photography Business Basics by Marcus Chen is waiting for approval.', false, 3],
  ['system', 'New instructor registration', 'Marcus Chen requested instructor approval.', false, 10],
  ['course-update', 'New student registration', 'A new student joined the platform.', true, 30],
  ['system', 'Payment received', 'A new payment of $59.99 was received (demo).', true, 52],
  ['system', 'Refund requested', 'A student requested a refund for Digital Marketing Strategy 2026.', false, 70],
  ['system', 'System alert', 'Weekly backup completed successfully.', true, 140],
  ['course-update', 'Course approved', 'Web Performance & Core Web Vitals was approved and published.', true, 200],
];

export const adminNotifications: AppNotification[] = ADMIN_RAW.map(([type, title, message, read, hours], i) => ({
  id: `an${i + 1}`,
  type,
  title,
  message,
  read,
  createdAt: daysAgo(0, hours),
  audience: 'admin' as const,
}));
