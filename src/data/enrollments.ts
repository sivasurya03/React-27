import type { Enrollment } from '@/types';
import { daysAgo } from './time';

/** studentId, courseId, progress, days since enrolment, days since last access */
const RAW: [string, string, number, number, number][] = [
  ['s1', 'c1', 62, 40, 1], ['s1', 'c3', 100, 90, 30], ['s1', 'c6', 18, 12, 2], ['s1', 'c8', 0, 3, 3], ['s1', 'c11', 35, 25, 6],
  ['s2', 'c1', 100, 80, 20], ['s2', 'c2', 45, 30, 4], ['s2', 'c5', 12, 9, 2],
  ['s3', 'c3', 78, 35, 1], ['s3', 'c4', 20, 14, 5],
  ['s4', 'c5', 100, 120, 50], ['s4', 'c6', 55, 40, 3], ['s4', 'c7', 8, 6, 1],
  ['s5', 'c8', 90, 60, 2], ['s5', 'c9', 30, 22, 8],
  ['s6', 'c2', 15, 18, 9], ['s6', 'c12', 66, 28, 1],
  ['s7', 'c10', 100, 70, 25], ['s7', 'c3', 5, 4, 4],
  ['s8', 'c6', 100, 95, 33], ['s8', 'c7', 72, 20, 2],
  ['s9', 'c11', 48, 33, 7], ['s9', 'c9', 0, 2, 2],
  ['s10', 'c13', 25, 15, 3], ['s10', 'c12', 100, 90, 40],
  ['s11', 'c1', 82, 50, 1],
  ['s12', 'c5', 38, 26, 5], ['s12', 'c13', 60, 31, 2],
  ['s13', 'c4', 100, 75, 36],
  ['s14', 'c7', 100, 66, 28],
  ['s15', 'c10', 14, 11, 6],
  ['s3', 'c1', 90, 45, 2], ['s4', 'c1', 100, 70, 20], ['s5', 'c1', 34, 21, 4], ['s7', 'c1', 8, 6, 1], ['s8', 'c1', 100, 88, 31], ['s13', 'c1', 55, 38, 3],
  ['s9', 'c2', 22, 17, 5], ['s10', 'c2', 100, 80, 30], ['s11', 'c2', 67, 44, 2], ['s12', 'c2', 0, 3, 3], ['s14', 'c2', 41, 27, 6],
  ['s15', 'c15', 18, 9, 4], ['s3', 'c15', 100, 40, 12], ['s5', 'c15', 52, 23, 2], ['s6', 'c15', 0, 2, 2],
  ['s8', 'c16', 100, 120, 60], ['s9', 'c16', 76, 90, 20], ['s12', 'c16', 30, 50, 33],
];

export const enrollments: Enrollment[] = RAW.map(([studentId, courseId, progress, enrolled, accessed], i) => ({
  id: `e${i + 1}`,
  studentId,
  courseId,
  progress,
  status: progress === 0 ? 'not-started' : progress === 100 ? 'completed' : 'in-progress',
  enrolledAt: daysAgo(enrolled),
  lastAccessedAt: daysAgo(progress === 0 ? enrolled : accessed),
}));
