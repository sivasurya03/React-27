import type { Chapter, Lesson, LessonType } from '@/types';

/** Title prefixes: a: article, q: quiz, x: assignment, r: resource. No prefix means video. */
type RawChapter = [string, string[]];

const RAW: Record<string, RawChapter[]> = {
  c1: [
    ['Foundations', ['Setting up Vite and TypeScript', 'Components, props and JSX', 'a:Typing props the right way']],
    ['State and Effects', ['useState and useReducer in depth', 'Effects without the footguns', 'q:Hooks checkpoint quiz']],
    ['Real-World Patterns', ['Data fetching with custom hooks', 'Global state with Redux Toolkit', 'x:Build a task board app']],
  ],
  c2: [
    ['Server Basics', ['How the web request cycle works', 'Express routing and middleware', 'a:REST API design checklist']],
    ['Data Layer', ['Modelling data with PostgreSQL', 'Queries, joins and indexes', 'q:SQL fundamentals quiz']],
    ['Shipping It', ['Authentication with JWT', 'Deploying to a cloud host', 'x:Launch your own API']],
  ],
  c3: [
    ['Design Thinking', ['What makes a design usable', 'User research in a week', 'a:Interview script template']],
    ['Figma Essentials', ['Frames, auto layout and constraints', 'Components and variants', 'x:Redesign a checkout flow']],
    ['Prototyping', ['Interactive prototypes', 'Usability testing sessions', 'q:Heuristics quiz']],
  ],
  c4: [
    ['Tokens and Foundations', ['Why design systems fail', 'Colour, type and spacing tokens', 'a:Naming conventions guide']],
    ['Building the Library', ['Component anatomy', 'Documenting for developers', 'r:Starter token pack']],
    ['Governance', ['Versioning and contribution', 'Measuring adoption', 'x:Audit a real product UI']],
  ],
  c5: [
    ['Python for Analysis', ['Notebooks and the Python toolchain', 'NumPy arrays in practice', 'a:Vectorisation cheat sheet']],
    ['Working with Pandas', ['Loading and cleaning messy data', 'Grouping, joins and pivots', 'q:Pandas skills check']],
    ['Insight and Storytelling', ['Visualising with Matplotlib', 'Exploratory data analysis workflow', 'x:Analyse a public dataset']],
  ],
  c6: [
    ['ML Fundamentals', ['Supervised vs unsupervised learning', 'Linear and logistic regression', 'a:Bias and variance explained']],
    ['Models That Work', ['Decision trees and random forests', 'Evaluating models properly', 'q:Metrics quiz']],
    ['Practical ML', ['Feature engineering', 'Building an end-to-end pipeline', 'x:Predict customer churn']],
  ],
  c7: [
    ['LLM Basics', ['How large language models work', 'Prompting patterns that hold up', 'a:Prompt evaluation template']],
    ['Building Features', ['Calling model APIs safely', 'Retrieval-augmented generation', 'q:RAG concepts quiz']],
    ['Production', ['Guardrails and cost control', 'Testing AI features', 'x:Ship a document Q&A tool']],
  ],
  c8: [
    ['Strategy', ['Understanding your audience', 'Building a funnel that converts', 'a:Positioning worksheet']],
    ['Channels', ['SEO fundamentals', 'Paid social that pays back', 'q:Channel mix quiz']],
    ['Measurement', ['Analytics and attribution', 'Reporting to stakeholders', 'x:Plan a 90-day campaign']],
  ],
  c9: [
    ['Product Thinking', ['Finding the real problem', 'Prioritisation frameworks', 'a:Roadmap template']],
    ['Strategy', ['Competitive analysis', 'Pricing and positioning', 'q:Strategy concepts quiz']],
    ['Execution', ['Working with engineering teams', 'Launch and iterate', 'x:Write a product strategy memo']],
  ],
  c10: [
    ['Camera Craft', ['Exposure without guesswork', 'Lenses and focal length', 'a:Settings quick reference']],
    ['Portraits', ['Directing natural poses', 'Window light and reflectors', 'x:Shoot a three-light portrait set']],
    ['Street and Editing', ['Seeing the decisive moment', 'A fast Lightroom workflow', 'q:Composition quiz']],
  ],
  c11: [
    ['Money Basics', ['Budgeting that you will keep', 'Emergency funds and debt', 'a:Monthly budget sheet']],
    ['Investing', ['Index funds explained', 'Risk, return and time', 'q:Investing basics quiz']],
    ['Long-Term Plans', ['Retirement accounts', 'Taxes for beginners', 'x:Build your 5-year plan']],
  ],
  c12: [
    ['React Native Core', ['Expo setup and project tour', 'Core components and styling', 'a:Platform differences guide']],
    ['Navigation and Data', ['Stack and tab navigation', 'Fetching and caching data', 'q:Navigation quiz']],
    ['Release', ['Native device features', 'Building and publishing apps', 'x:Ship a habit tracker']],
  ],
  c13: [
    ['Cloud Foundations', ['Regions, zones and the shared model', 'IAM and least privilege', 'a:Cost awareness checklist']],
    ['Core Services', ['Compute with EC2 and Lambda', 'Storage and databases', 'q:Core services quiz']],
    ['Architecture', ['Designing for high availability', 'Monitoring and alerts', 'x:Design a three-tier app']],
  ],
  c14: [
    ['Streams and Buffers', ['Understanding Node streams', 'Backpressure in practice', 'a:Stream patterns cheat sheet']],
    ['Scaling Up', ['Clustering and worker threads', 'Caching strategies', 'q:Scaling concepts quiz']],
    ['Production Readiness', ['Observability and logging', 'Graceful shutdown', 'x:Harden a Node service']],
  ],
  c15: [
    ['Measuring Performance', ['What Core Web Vitals really measure', 'Profiling with Lighthouse', 'a:Performance budget template']],
    ['Fixing the Big Wins', ['Optimising images and fonts', 'Reducing JavaScript cost', 'q:Web vitals quiz']],
    ['Keeping It Fast', ['Performance in CI', 'Monitoring real users', 'x:Audit a live website']],
  ],
  c17: [
    ['Pricing and Clients', ['Pricing your work', 'Finding your first clients', 'a:Client enquiry template']],
    ['Contracts and Delivery', ['What belongs in a contract', 'Delivering and invoicing', 'r:Contract checklist']],
    ['Growing Sustainably', ['Marketing without burnout', 'Building repeat business', 'x:Write your service packages']],
  ],
  c18: [
    ['Choosing the Right Chart', ['Matching charts to questions', 'Colour and clarity', 'a:Chart chooser cheat sheet']],
    ['Honest Visuals', ['Avoiding misleading axes', 'Annotating for insight', 'r:Style guide template']],
    ['Practice', ['Redesigning a bad chart', 'Dashboards that work', 'x:Visualise a public dataset']],
  ],
  c16: [
    ['Modern Language Basics', ['let, const and arrow functions', 'Modules and the DOM without jQuery', 'a:jQuery to vanilla cheat sheet']],
    ['Async and Data', ['Promises and fetch', 'Working with JSON APIs', 'q:Async JavaScript quiz']],
    ['Moving Forward', ['Choosing a framework', 'Migrating step by step', 'x:Migrate a small jQuery widget']],
  ],
};

const TYPE_BY_PREFIX: Record<string, LessonType> = { a: 'article', q: 'quiz', x: 'assignment', r: 'resource' };

function parseTitle(raw: string): { title: string; type: LessonType } {
  const match = /^([aqxr]):(.*)$/.exec(raw);
  return match ? { title: match[2], type: TYPE_BY_PREFIX[match[1]] } : { title: raw, type: 'video' };
}

function build(courseId: string, chapters: RawChapter[]): Chapter[] {
  const seed = Number(courseId.slice(1));
  let index = 0;
  return chapters.map(([chapterTitle, lessonTitles], ci) => {
    const chapterId = `${courseId}-ch${ci + 1}`;
    const lessons: Lesson[] = lessonTitles.map((raw, li) => {
      const { title, type } = parseTitle(raw);
      const minutes = type === 'article' || type === 'resource' ? 8 + ((index * 3 + seed) % 8) : 12 + ((index * 11 + seed * 3) % 28);
      index += 1;
      return {
        id: `${chapterId}-l${li + 1}`,
        courseId,
        chapterId,
        title,
        type,
        duration: minutes,
        isCompleted: false,
        isPreview: ci === 0 && li === 0,
      };
    });
    return { id: chapterId, courseId, title: chapterTitle, lessons };
  });
}

export const curriculumByCourse: Record<string, Chapter[]> = Object.fromEntries(
  Object.entries(RAW).map(([courseId, chapters]) => [courseId, build(courseId, chapters)]),
);

export const flattenLessons = (courseId: string): Lesson[] =>
  (curriculumByCourse[courseId] ?? []).flatMap((chapter) => chapter.lessons);
