# LearnSphere: Online Learning Management System

A complete front-end LMS with four connected experiences: **Student**, **Learning**, **Instructor** and **Admin**.
Everything runs in the browser. There is **no real backend**: the "API" is a mock service layer backed by
`localStorage`, designed so each service can later be swapped for real Axios calls without touching the UI.

## Tech stack

- React 18, TypeScript (strict), Vite
- Tailwind CSS (design tokens for light and dark mode)
- Redux Toolkit and React Redux
- React Router 6
- Axios (shared client in `src/services/apiClient.ts`; the mock services do not call it yet)
- Framer Motion
- Recharts
- Lucide React icons

## Run

```bash
npm install
npm run dev
```

## Build and checks

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run build       # typecheck + production build
npm test            # offline logic and data-integrity tests (tsx)
```

## Demo accounts

All demo accounts use the password `Demo@123`.

| Role       | Email                        | Lands on       |
|------------|------------------------------|----------------|
| Student    | student@learnsphere.demo     | `/`            |
| Instructor | instructor@learnsphere.demo  | `/instructor`  |
| Admin      | admin@learnsphere.demo       | `/admin`       |

New student accounts can be created on the Register page.

## Modules

### Student
- Sign in, register (with terms), forgot password, remember me, protected routes
- Dashboard with stats, continue learning, weekly activity, upcoming quizzes and assignments, achievements, recommendations
- Course catalogue with search, five filters, sorting and pagination; mobile filter drawer
- Course details with curriculum, instructor, reviews, FAQ, related courses and a confirm-to-enrol flow
- My Learning (tabs, search, sort), wishlist, profile (photo upload, validation, preferences), notifications, certificates
- Global search (Ctrl/Cmd + K), light and dark mode

### Learning
- Learning player with demo video controls (play, seek, volume, speed, captions, fullscreen), reading, quiz, assignment and resource lessons
- Curriculum sidebar (drawer on mobile) with chapter progress and locked lessons
- Lesson completion, progress calculation, last-accessed resume, per-lesson notes
- Quiz engine (navigation, unanswered-question confirmation, scoring, review, retry) and assignment drafts and submission
- Course completion screen, certificate record, certificate view with print or save as PDF

### Instructor
- Dashboard (KPIs, enrolment and revenue trends, course performance, activity, top courses)
- Course management (search, filters, sort, pagination, duplicate, submit or publish, unpublish, archive, restore, delete)
- Five-step course builder: basics, pricing, thumbnail upload, curriculum (drag or button reorder), publish preview
- Quiz, assignment and resource builders with validation; instructor preview of the student view
- Students (filters, detail drawer), analytics (7D / 30D / 90D / 1Y, per-course), earnings with CSV export, reviews, profile, settings

### Admin
- Dashboard (KPIs with trends, charts, items needing attention, recent enrolments)
- Students and instructors: search, filters, sort, pagination, detail drawers, edit, activate, suspend, approve
- Courses: approve or reject (with reason), publish, unpublish, archive, restore, edit, delete
- Enrolments: filters including date range, detail drawer, cancel, refund and reinstate
- Revenue (summary, charts, transactions, CSV), analytics (period selector, category and instructor performance), reports (generate, CSV, print)
- Platform settings (registrations, instructor and course approvals, maintenance mode), notifications, global search

### How the modules affect each other
- An instructor's published course goes to **Pending review** when course approvals are on; an admin approves it and it appears in the student catalogue, or rejects it with a reason the instructor sees.
- Suspending or deactivating a student or instructor blocks sign-in and shows an access-blocked screen.
- Cancelling or refunding an enrolment removes the student's access to that course.
- Student registrations and enrolments appear in admin lists, totals and notifications.
- Closing registrations or enabling maintenance mode is enforced by the mock auth service.

## Architecture

```
Component -> Redux slice / thunk -> service (mock database or API) -> localStorage
```

- `src/features/*`: Redux slices and thunks
- `src/services/*`: mock services and databases (`courseDb`, `adminDb`), analytics generators
- `src/components/ui`: design-system components; `layout`, `charts`, `courses`, `learning`, `instructor`, `admin`: feature components
- `src/pages/*`: route pages (student, instructor, admin, auth); `src/routes`: router and role guards
- `tests/`: offline logic and data-integrity tests

## Known limitations

- No real backend, payments, video hosting or file storage. Video playback is a controlled demo timeline, uploaded files keep only metadata, resource downloads are generated demo text files, and certificates are demo documents (not verified).
- Analytics, earnings, revenue and several admin metrics are deterministic demo data derived from the course catalogue, plus live activity from the current browser.
- Stored in `localStorage` only: clearing site data resets the demo.
- Display currency, session timeout and the "strong passwords" switch in admin settings are stored but not enforced.
