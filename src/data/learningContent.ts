import type { LessonContent, Lesson, LearningResource, QuizQuestion } from '@/types';

export const PASS_MARK = 70;

/** prompt, options, index of the correct option */
type RawQuestion = [string, [string, string, string, string], number];

const BANK: Record<string, RawQuestion[]> = {
  c1: [
    ['Which hook should you use to run a side effect after render?', ['useMemo', 'useEffect', 'useRef', 'useId'], 1],
    ['What does TypeScript add to React props?', ['Runtime validation only', 'Compile-time type safety', 'Automatic styling', 'Faster rendering'], 1],
    ['Which Redux Toolkit function creates a slice of state?', ['createSlice', 'createStore', 'combineSlices', 'makeReducer'], 0],
    ['Why list dependencies in an effect?', ['To style the component', 'To control when the effect re-runs', 'To avoid TypeScript errors', 'To cache the DOM'], 1],
  ],
  c2: [
    ['Which HTTP method is typically used to create a resource?', ['GET', 'PUT', 'POST', 'HEAD'], 2],
    ['What does an SQL index mainly improve?', ['Storage size', 'Query speed', 'Password security', 'Backup time'], 1],
    ['What is a JWT used for?', ['Styling pages', 'Carrying signed identity claims', 'Compressing images', 'Routing requests'], 1],
    ['Which Express concept runs between request and response?', ['Middleware', 'Migration', 'Webhook', 'Schema'], 0],
  ],
  c3: [
    ['What is the main goal of usability testing?', ['Pick brand colours', 'Observe real users completing tasks', 'Write production code', 'Increase page weight'], 1],
    ['Which Figma feature makes layouts resize with content?', ['Masks', 'Auto layout', 'Blend modes', 'Plugins'], 1],
    ['A wireframe is best described as…', ['A final visual design', 'A low-fidelity layout sketch', 'A coded prototype', 'A style guide'], 1],
    ['Which heuristic says the system should show what is happening?', ['Visibility of system status', 'Error prevention', 'Flexibility', 'Aesthetic design'], 0],
  ],
  c5: [
    ['Which Pandas object is a two-dimensional table?', ['Series', 'DataFrame', 'ndarray', 'Index'], 1],
    ['What does `groupby` do?', ['Sorts columns', 'Splits data into groups to aggregate', 'Deletes duplicates', 'Plots a chart'], 1],
    ['Why vectorise operations with NumPy?', ['Shorter variable names', 'Much faster than Python loops', 'Automatic plots', 'Smaller files'], 1],
    ['Which step usually comes first in analysis?', ['Modelling', 'Cleaning and inspecting data', 'Presenting', 'Deploying'], 1],
  ],
  c6: [
    ['Which problem type predicts a continuous number?', ['Classification', 'Regression', 'Clustering', 'Ranking'], 1],
    ['What does overfitting mean?', ['Model is too simple', 'Model memorises training data', 'Data is too small to load', 'Training is too fast'], 1],
    ['Why split data into train and test sets?', ['To estimate performance on unseen data', 'To double the dataset', 'To speed up plotting', 'To remove outliers'], 0],
    ['Which metric suits imbalanced classification better than accuracy?', ['F1 score', 'Row count', 'Mean time', 'File size'], 0],
  ],
  c7: [
    ['What does RAG stand for?', ['Rapid API Gateway', 'Retrieval-augmented generation', 'Random answer generator', 'Recursive agent graph'], 1],
    ['Which practice reduces harmful or off-topic outputs?', ['Guardrails', 'Longer prompts only', 'Disabling logging', 'Caching images'], 0],
    ['Where should API keys for model providers live?', ['In client-side code', 'In a public repo', 'On a secure server', 'In page titles'], 2],
    ['How should you evaluate prompt changes?', ['By gut feeling', 'Against a fixed set of test cases', 'By prompt length', 'By font size'], 1],
  ],
  c8: [
    ['What does SEO aim to improve?', ['Unpaid search visibility', 'Server memory', 'Email deliverability only', 'Video resolution'], 0],
    ['Which metric measures the share of visitors who take a desired action?', ['Bounce rate', 'Conversion rate', 'Impressions', 'Latency'], 1],
    ['The top of a marketing funnel focuses on…', ['Awareness', 'Renewals', 'Refunds', 'Invoicing'], 0],
    ['Why use UTM parameters?', ['To track campaign sources', 'To compress links', 'To block bots', 'To translate pages'], 0],
  ],
  c9: [
    ['What should come before choosing a solution?', ['Defining the problem', 'Hiring more staff', 'Picking a logo', 'Setting a price'], 0],
    ['RICE is a framework for…', ['Prioritisation', 'Hiring', 'Branding', 'Testing code'], 0],
    ['A roadmap should primarily communicate…', ['Intent and priorities', 'Exact code tasks', 'Server costs', 'Meeting minutes'], 0],
    ['Which is a leading indicator of product health?', ['Activation rate', 'Last year revenue', 'Office size', 'Number of slides'], 0],
  ],
  c10: [
    ['Which three settings form the exposure triangle?', ['ISO, aperture, shutter speed', 'Zoom, flash, timer', 'White balance, crop, tint', 'Focus, burst, grid'], 0],
    ['A wide aperture (low f-number) gives…', ['Deeper depth of field', 'Shallower depth of field', 'Longer exposure only', 'Less light'], 1],
    ['Soft window light is great for portraits because it…', ['Creates harsh shadows', 'Wraps gently around the face', 'Needs no camera', 'Removes colour'], 1],
    ['The rule of thirds helps with…', ['Composition', 'Battery life', 'File format', 'Lens cleaning'], 0],
  ],
  c11: [
    ['What is an emergency fund for?', ['Unexpected expenses', 'Holiday shopping', 'Stock tips', 'Paying subscriptions'], 0],
    ['An index fund typically…', ['Tracks a market index', 'Picks single stocks daily', 'Guarantees returns', 'Holds only cash'], 0],
    ['Compound interest means earning interest on…', ['Principal and past interest', 'Principal only', 'Fees', 'Taxes'], 0],
    ['Which is generally true about risk and return?', ['Higher potential return usually means higher risk', 'Risk and return are unrelated', 'Low risk always gives high return', 'Cash always beats stocks'], 0],
  ],
  c12: [
    ['Which tool makes React Native setup quick?', ['Expo', 'Webpack only', 'jQuery', 'Bootstrap'], 0],
    ['Which component renders scrollable lists efficiently?', ['FlatList', 'Table', 'Marquee', 'Iframe'], 0],
    ['React Native styles are written using…', ['JavaScript objects', 'Plain CSS files only', 'SASS maps', 'XML layouts'], 0],
    ['Stack navigation is used to…', ['Move between screens', 'Store data', 'Compress images', 'Sign builds'], 0],
  ],
  c14: [
    ['What problem does backpressure solve in streams?', ['Producers outpacing consumers', 'Slow DNS lookups', 'Large bundle sizes', 'Missing types'], 0],
    ['Which module lets Node use multiple CPU cores via separate processes?', ['cluster', 'path', 'url', 'readline'], 0],
    ['Why add structured logging?', ['Easier searching and alerting', 'Smaller code', 'Faster builds', 'Free hosting'], 0],
    ['What does graceful shutdown allow?', ['Finishing in-flight work before exit', 'Skipping tests', 'Hiding errors', 'Doubling memory'], 0],
  ],
  c15: [
    ['Which metric measures loading performance of the main content?', ['Largest Contentful Paint', 'Total Blocking Time only', 'Cumulative Layout Shift', 'First Input Delay only'], 0],
    ['Which change usually reduces image weight the most?', ['Modern formats and correct sizing', 'Adding more images', 'Disabling caching', 'Inlining everything'], 0],
    ['CLS measures…', ['Visual stability', 'Server time', 'Bundle count', 'Font count'], 0],
    ['Why measure real-user data?', ['Lab tests cannot capture every device and network', 'It is cheaper than Lighthouse', 'It replaces testing', 'It improves SEO directly'], 0],
  ],
  c16: [
    ['Which API replaces $.ajax in modern JavaScript?', ['fetch', 'alert', 'eval', 'document.write'], 0],
    ['What does `const` declare?', ['A binding that cannot be reassigned', 'A global variable', 'A function', 'A class'], 0],
    ['Which selects an element without jQuery?', ['document.querySelector', '$$$', 'getJQuery', 'window.find'], 0],
    ['A safe migration approach is…', ['Move one feature at a time', 'Rewrite everything overnight', 'Delete tests', 'Disable linting'], 0],
  ],
  c13: [
    ['What principle should IAM follow?', ['Least privilege', 'Shared admin passwords', 'Open to everyone', 'No logging'], 0],
    ['Which AWS service provides object storage?', ['S3', 'EC2', 'IAM', 'VPC'], 0],
    ['Spreading workloads across zones improves…', ['High availability', 'Font rendering', 'Disk labels', 'Password length'], 0],
    ['The shared responsibility model means…', ['AWS secures the cloud, you secure what you put in it', 'AWS secures everything', 'You secure the data centre', 'Nobody is responsible'], 0],
  ],
};

/** Instructor-authored lesson content (quizzes, assignments, resources), synced from the store. */
let overrides: Record<string, LessonContent> = {};
export const setLessonContentOverrides = (next: Record<string, LessonContent>): void => {
  overrides = next;
};

export const quizFor = (courseId: string, lessonId: string): QuizQuestion[] =>
  overrides[lessonId]?.quiz ?? (BANK[courseId] ?? []).map(([prompt, options, correctIndex], i) => ({ id: `${lessonId}-q${i + 1}`, prompt, options, correctIndex }));

const BRIEFS: Record<string, string> = {
  c1: 'Build a small task board with typed components, a custom hook and Redux Toolkit state.',
  c2: 'Design a REST API with at least three routes, a database table and token-based auth.',
  c3: 'Redesign a checkout flow: produce wireframes, a Figma prototype and a short rationale.',
  c4: 'Audit a real product UI and list ten inconsistencies with proposed design tokens.',
  c5: 'Pick a public dataset, clean it, and present three findings with charts.',
  c6: 'Train a churn model, compare two algorithms and explain which metric you chose.',
  c7: 'Ship a document Q&A prototype and describe how you tested its answers.',
  c8: 'Plan a 90-day campaign with channels, budget split, KPIs and a reporting cadence.',
  c9: 'Write a one-page product strategy memo for a product you use daily.',
  c10: 'Shoot a set of five portraits with natural light and note the settings used.',
  c11: 'Draft a five-year plan covering budget, emergency fund and an investing approach.',
  c12: 'Ship a small habit tracker and describe your navigation structure.',
  c13: 'Design a three-tier architecture on AWS and explain how it stays available.',
  c14: 'Harden a small Node service with logging, health checks and graceful shutdown.',
  c15: 'Audit a live website with Lighthouse and propose three prioritised fixes.',
  c16: 'Migrate a small jQuery widget to modern JavaScript and note what changed.',
};

export function assignmentBrief(courseId: string, lessonId?: string): { instructions: string[]; maxScore: number; dueDays: number } {
  const custom = lessonId ? overrides[lessonId]?.assignment : undefined;
  if (custom) return { instructions: custom.instructions, maxScore: custom.maxScore, dueDays: custom.dueDays };
  return {
    maxScore: 100,
    dueDays: 30,
    instructions: [
      BRIEFS[courseId] ?? 'Complete the practical task described in the lesson.',
      'Write a short summary of your approach and results (at least 30 characters).',
      'Optionally attach your work files (up to 5 MB).',
      'You can save a draft first and submit when you are ready.',
    ],
  };
}

export function resourcesFor(courseId: string, courseTitle: string, lessonId?: string): LearningResource[] {
  const custom = lessonId ? overrides[lessonId]?.resources : undefined;
  if (custom && custom.length > 0) return custom;
  const n = Number(courseId.slice(1)) || 1;
  const short = courseTitle.split(/[:&-]/)[0].trim();
  return [
    { id: `${courseId}-slides`, title: `${short} lecture slides`, type: 'slides', sizeKb: 2100 + n * 90 },
    { id: `${courseId}-notes`, title: 'Study notes', type: 'notes', sizeKb: 280 + n * 12 },
    { id: `${courseId}-cheat`, title: 'Quick-reference cheat sheet', type: 'pdf', sizeKb: 640 + n * 25 },
    { id: `${courseId}-files`, title: 'Starter project files', type: 'zip', sizeKb: 3800 + n * 140 },
    { id: `${courseId}-reading`, title: 'Further reading list', type: 'reference', sizeKb: 90 + n * 4 },
  ];
}

export function lessonOverview(lesson: Lesson, courseTitle: string): { summary: string; points: string[] } {
  const verb = { video: 'watch', article: 'read', quiz: 'test yourself with', assignment: 'practise with', resource: 'use the materials for' }[lesson.type];
  return {
    summary: `In this lesson you will ${verb} “${lesson.title}”, part of ${courseTitle}. Take your time, pause whenever you like, and write notes as you go.`,
    points: [
      `Understand the core idea behind ${lesson.title.toLowerCase()}`,
      'See how it fits into the wider course project',
      'Apply it in the next lesson or exercise',
    ],
  };
}

/** Caption lines for the demo player, spread across the timeline. */
export const captionLines = (lesson: Lesson): string[] => [
  `Welcome to “${lesson.title}”.`,
  'First, let us look at the idea we are about to build on.',
  'Now we walk through a worked example step by step.',
  'Notice how each decision connects to the course project.',
  'Let us recap the key points before moving on.',
];
