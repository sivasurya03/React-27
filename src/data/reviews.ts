import type { Review } from '@/types';
import { daysAgo } from './time';

/** courseId, studentId, rating, comment, days ago */
const RAW: [string, string, number, string, number][] = [
  ['c1', 's2', 5, 'The hooks chapters finally made effects click for me. Great pacing and real projects.', 18],
  ['c1', 's11', 5, 'Arjun explains the why behind each pattern. My code reviews improved immediately.', 9],
  ['c1', 's1', 4, 'Excellent content; I would love a bonus section on testing.', 6],
  ['c2', 's6', 4, 'Solid beginner path from SQL to deployment. The API project was the highlight.', 14],
  ['c2', 's2', 5, 'Clear, structured and practical. Authentication section alone was worth it.', 22],
  ['c3', 's1', 5, 'Helped me build a case study I actually showed in interviews.', 28],
  ['c3', 's3', 5, 'Priya gives honest critique habits that stick. Loved the usability testing lesson.', 11],
  ['c3', 's7', 4, 'Great fundamentals, a bit fast in the prototyping chapter.', 3],
  ['c4', 's13', 5, 'The best design systems course I have found. Governance module is gold.', 33],
  ['c5', 's4', 5, 'Pandas finally feels natural. The messy-data lesson was very realistic.', 47],
  ['c5', 's12', 4, 'Good depth, and the notebooks were easy to follow along with.', 12],
  ['c5', 's2', 4, 'Strong start; I wanted a few more visualisation examples.', 7],
  ['c6', 's8', 5, 'Rigorous but friendly. Evaluating models properly changed how I work.', 30],
  ['c6', 's4', 5, 'Dr. Krishnan balances theory and practice beautifully.', 19],
  ['c7', 's14', 5, 'Practical RAG walkthrough that I used at work the following week.', 26],
  ['c7', 's8', 4, 'Very current and useful. Guardrails lesson was a pleasant surprise.', 5],
  ['c8', 's5', 4, 'Clear funnel framework and useful templates for planning campaigns.', 16],
  ['c10', 's7', 5, 'My portraits improved after the window light lesson alone.', 23],
  ['c11', 's9', 5, 'Plain-English investing explanations, no jargon walls.', 10],
  ['c12', 's10', 5, 'Shipped my first app to the store thanks to this course.', 38],
  ['c12', 's6', 4, 'Well organised, and the navigation module saved me hours.', 4],
  ['c13', 's12', 4, 'Good mix of concepts and hands-on architecture practice.', 8],
  ['c1', 's3', 5, 'The best React course I have taken. The Redux Toolkit chapter is superb.', 13],
  ['c1', 's4', 4, 'Great examples. I would love a short section on accessibility.', 17],
  ['c1', 's8', 5, 'Clear, practical and well paced. The task board project is a keeper.', 27],
  ['c2', 's10', 5, 'Finally understood authentication end to end. Highly recommended.', 21],
  ['c2', 's11', 4, 'Solid course; deployment chapter could use more cloud providers.', 15],
  ['c15', 's3', 5, 'Our Lighthouse scores jumped after the image optimisation lesson.', 11],
  ['c15', 's5', 4, 'Very actionable. More on real-user monitoring would be great.', 6],
  ['c16', 's8', 4, 'Helpful migration path for an old codebase.', 70],
  ['c16', 's9', 4, 'Good pace and practical exercises.', 45],
];

export const reviews: Review[] = RAW.map(([courseId, studentId, rating, comment, days], i) => ({
  id: `r${i + 1}`,
  courseId,
  studentId,
  rating,
  comment,
  createdAt: daysAgo(days),
}));
