export interface CourseContent {
  outcomes: string[];
  requirements: string[];
}

export const courseContent: Record<string, CourseContent> = {
  c1: { outcomes: ['Build typed React components and custom hooks', 'Manage complex state with Redux Toolkit', 'Fetch, cache and display remote data safely', 'Structure a maintainable production codebase'], requirements: ['Solid HTML, CSS and JavaScript basics', 'A computer with Node.js installed'] },
  c2: { outcomes: ['Design and build REST APIs with Node and Express', 'Model data and write efficient SQL queries', 'Add secure authentication with JWT', 'Deploy a full-stack app to the cloud'], requirements: ['No prior backend experience needed', 'Basic familiarity with JavaScript'] },
  c3: { outcomes: ['Run lightweight user research', 'Create wireframes and polished UI in Figma', 'Build interactive prototypes', 'Test designs with real users'], requirements: ['No design background required', 'A free Figma account'] },
  c4: { outcomes: ['Define colour, type and spacing tokens', 'Build and document a component library', 'Set up contribution and versioning workflows', 'Measure design system adoption'], requirements: ['Working knowledge of Figma or similar tools', 'Experience on a product team is helpful'] },
  c5: { outcomes: ['Clean and reshape messy real-world data', 'Analyse datasets with NumPy and Pandas', 'Create clear charts with Matplotlib', 'Present insights as a data story'], requirements: ['Basic Python syntax', 'Curiosity about data'] },
  c6: { outcomes: ['Train and tune core ML algorithms', 'Evaluate models with the right metrics', 'Engineer useful features', 'Ship an end-to-end ML pipeline'], requirements: ['Python fundamentals', 'High-school level maths'] },
  c7: { outcomes: ['Prompt language models reliably', 'Call model APIs securely and cost-effectively', 'Build retrieval-augmented generation features', 'Test and monitor AI features in production'], requirements: ['Comfortable writing code in any language', 'Familiarity with REST APIs'] },
  c8: { outcomes: ['Define audiences and positioning', 'Plan SEO, paid and email campaigns', 'Measure performance with analytics', 'Report results to stakeholders'], requirements: ['No marketing experience needed', 'Access to a website or project to practise on'] },
  c9: { outcomes: ['Frame problems worth solving', 'Prioritise with proven frameworks', 'Build and communicate a roadmap', 'Work effectively with engineering and design'], requirements: ['Some experience on a product or business team', 'Willingness to practise with case studies'] },
  c10: { outcomes: ['Control exposure, focus and light', 'Direct subjects for natural portraits', 'Compose compelling street photographs', 'Edit a full set in Lightroom'], requirements: ['Any camera with manual mode', 'Free Lightroom trial or similar editor'] },
  c11: { outcomes: ['Build a budget you will actually follow', 'Create a debt and emergency-fund plan', 'Understand index funds, risk and return', 'Plan long-term investing and taxes'], requirements: ['No finance background needed', 'A willingness to review your own spending'] },
  c12: { outcomes: ['Build cross-platform apps with Expo', 'Implement navigation and data fetching', 'Use native device features', 'Publish to the App Store and Google Play'], requirements: ['JavaScript and basic React knowledge', 'A phone or emulator for testing'] },
  c13: { outcomes: ['Explain core AWS services and the shared responsibility model', 'Apply IAM least-privilege access', 'Design highly available architectures', 'Monitor and control cloud costs'], requirements: ['No cloud experience needed', 'A free AWS account'] },
};

export const FAQS: { question: string; answer: string }[] = [
  { question: 'Do I get lifetime access after enrolling?', answer: 'Yes. Once you enrol, the course stays in My Learning and you can revisit every lesson at your own pace.' },
  { question: 'Is there a certificate of completion?', answer: 'Yes. Finish every lesson and your certificate will appear in the Certificates section.' },
  { question: 'Can I learn on my phone or tablet?', answer: 'Absolutely. LearnSphere is fully responsive, so lessons, progress and notes work on any screen size.' },
  { question: 'What if the course is not right for me?', answer: 'You can remove it from your wishlist at any time, and lessons marked as preview let you sample the content before you commit.' },
  { question: 'How long does it take to finish?', answer: 'Most learners complete the curriculum in a few weeks studying a few hours per week, but there are no deadlines.' },
];
