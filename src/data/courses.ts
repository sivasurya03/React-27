import type { Course, CourseCategory, CourseLevel, CourseStatus } from '@/types';
import { makeThumbnail } from '@/utils/thumbnail';
import { flattenLessons } from './curriculum';

type Raw = [
  id: string,
  title: string,
  category: CourseCategory,
  level: CourseLevel,
  instructorId: string,
  price: number,
  discount: number,
  rating: number,
  students: number,
  tags: string[],
  description: string,
  status: CourseStatus,
  featured?: boolean,
];

const RAW: Raw[] = [
  ['c1', 'Modern React & TypeScript Masterclass', 'Web Development', 'Intermediate', 'i2', 89.99, 20, 4.8, 18420, ['react', 'typescript', 'hooks'], 'Build production-grade interfaces with React, TypeScript and Redux Toolkit, from component design to data fetching and state.', 'published', true],
  ['c2', 'Full-Stack Web Development with Node', 'Web Development', 'Beginner', 'i2', 79.99, 35, 4.6, 24310, ['node', 'express', 'postgres'], 'Go from zero to a deployed full-stack app: REST APIs, SQL databases, authentication and cloud hosting.', 'published'],
  ['c3', 'UI/UX Design Fundamentals with Figma', 'UI/UX Design', 'Beginner', 'i3', 64.99, 15, 4.7, 15230, ['figma', 'ux', 'prototyping'], 'Learn research, wireframing and high-fidelity design in Figma while building a portfolio-ready case study.', 'published', true],
  ['c4', 'Design Systems for Product Teams', 'UI/UX Design', 'Advanced', 'i3', 94.99, 0, 4.9, 6120, ['design-systems', 'tokens', 'components'], 'Create, document and govern a scalable design system that designers and engineers both trust.', 'published'],
  ['c5', 'Data Science with Python and Pandas', 'Data Science', 'Beginner', 'i4', 74.99, 25, 4.5, 21850, ['python', 'pandas', 'analysis'], 'Clean, analyse and visualise real datasets with Python, and learn to tell stories with data.', 'published'],
  ['c6', 'Machine Learning A-Z: Hands-On', 'Artificial Intelligence', 'Intermediate', 'i1', 99.99, 30, 4.8, 27640, ['machine-learning', 'scikit-learn', 'python'], 'Understand and apply core ML algorithms, evaluate them honestly, and ship an end-to-end pipeline.', 'published', true],
  ['c7', 'Generative AI for Developers', 'Artificial Intelligence', 'Intermediate', 'i1', 84.99, 10, 4.7, 12980, ['llm', 'rag', 'prompting'], 'Add reliable AI features to products using LLM APIs, retrieval and sensible guardrails.', 'published', true],
  ['c8', 'Digital Marketing Strategy 2026', 'Digital Marketing', 'All Levels', 'i5', 59.99, 40, 4.4, 9870, ['seo', 'paid-social', 'analytics'], 'Plan, run and measure campaigns across search, social and email with a data-driven approach.', 'published'],
  ['c9', 'Product Management & Business Strategy', 'Business', 'Intermediate', 'i6', 69.99, 0, 4.6, 7410, ['product', 'strategy', 'roadmaps'], 'Learn how great product managers find problems worth solving and turn strategy into shipped outcomes.', 'pending'],
  ['c10', 'Portrait & Street Photography', 'Photography', 'All Levels', 'i8', 54.99, 20, 4.9, 5320, ['portrait', 'lightroom', 'composition'], 'Master exposure, light and composition, then edit your photographs with a fast, consistent workflow.', 'published'],
  ['c11', 'Personal Finance & Investing Basics', 'Finance', 'Beginner', 'i6', 49.99, 50, 4.5, 16750, ['budgeting', 'investing', 'taxes'], 'Take control of your money with budgeting, debt strategy and long-term investing explained simply.', 'published'],
  ['c12', 'React Native: Build iOS & Android Apps', 'Mobile Development', 'Intermediate', 'i7', 84.99, 25, 4.7, 11260, ['react-native', 'expo', 'mobile'], 'Build and publish cross-platform mobile apps with React Native and Expo.', 'published'],
  ['c14', 'Advanced Node.js Patterns', 'Web Development', 'Advanced', 'i2', 74.99, 0, 0, 0, ['node', 'performance', 'architecture'], 'Go beyond the basics with streams, clustering, caching and production-ready architecture patterns for Node services.', 'draft'],
  ['c15', 'Web Performance & Core Web Vitals', 'Web Development', 'Intermediate', 'i2', 54.99, 10, 4.6, 3210, ['performance', 'lighthouse', 'web-vitals'], 'Measure, diagnose and improve real-world page speed using Lighthouse, Core Web Vitals and modern loading techniques.', 'published'],
  ['c16', 'jQuery to Modern JavaScript', 'Web Development', 'Beginner', 'i2', 39.99, 30, 4.2, 6840, ['javascript', 'jquery', 'migration'], 'A legacy course that helps jQuery developers migrate to modern JavaScript and frameworks.', 'archived'],
  ['c17', 'Photography Business Basics', 'Photography', 'Beginner', 'i8', 59.99, 0, 0, 0, ['business', 'freelance', 'photography'], 'Turn your photography into a business: pricing, clients, contracts and building a sustainable freelance workflow.', 'pending'],
  ['c18', 'Intro to Data Visualisation', 'Data Science', 'Beginner', 'i4', 49.99, 10, 0, 0, ['visualisation', 'charts', 'storytelling'], 'Learn to choose the right chart and design clear, honest visualisations for any audience.', 'rejected'],
  ['c13', 'AWS Cloud Practitioner to Solutions Architect', 'Cloud Computing', 'Beginner', 'i7', 89.99, 15, 4.6, 13490, ['aws', 'cloud', 'architecture'], 'Understand core cloud services and design secure, highly available architectures on AWS.', 'published'],
];

export const courses: Course[] = RAW.map(
  ([id, title, category, level, instructorId, price, discount, rating, studentsCount, tags, description, status, featured], i) => {
    const lessons = flattenLessons(id);
    const minutes = lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
    return {
      id,
      title,
      description,
      thumbnail: makeThumbnail(category, id),
      category,
      level,
      language: 'English',
      price,
      discount,
      rating,
      studentsCount,
      duration: Math.round((minutes / 60) * 10) / 10,
      lessonsCount: lessons.length,
      instructorId,
      status,
      tags,
      createdAt: new Date(Date.UTC(2025, i % 12, 5 + i)).toISOString(),
      featured,
      rejectionReason: id === 'c18' ? 'The curriculum overlaps heavily with an existing course. Please add original practical projects and resubmit.' : undefined,
    };
  },
);
