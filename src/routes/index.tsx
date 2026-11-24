import { lazy, Suspense, type ReactElement } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { PageSkeleton } from '@/components/common/PageSkeleton';
import { RouteError } from '@/components/common/RouteError';
import { AppShell } from '@/components/layout/AppShell';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/selectors';
import { homeFor } from '@/utils/paths';
import { GuestRoute, RoleRoute } from './guards';

const Landing = lazy(() => import('@/pages/Landing'));
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const StudentDashboard = lazy(() => import('@/pages/student/StudentDashboard'));
const InstructorDashboard = lazy(() => import('@/pages/instructor/InstructorDashboard'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminStudents = lazy(() => import('@/pages/admin/AdminStudents'));
const AdminInstructors = lazy(() => import('@/pages/admin/AdminInstructors'));
const AdminCourses = lazy(() => import('@/pages/admin/AdminCourses'));
const AdminEnrollments = lazy(() => import('@/pages/admin/AdminEnrollments'));
const AdminRevenue = lazy(() => import('@/pages/admin/AdminRevenue'));
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'));
const AdminReports = lazy(() => import('@/pages/admin/AdminReports'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));
const Courses = lazy(() => import('@/pages/student/Courses'));
const CourseDetails = lazy(() => import('@/pages/student/CourseDetails'));
const MyLearning = lazy(() => import('@/pages/student/MyLearning'));
const Wishlist = lazy(() => import('@/pages/student/Wishlist'));
const Profile = lazy(() => import('@/pages/student/Profile'));
const Certificates = lazy(() => import('@/pages/student/Certificates'));
const Notifications = lazy(() => import('@/pages/student/Notifications'));
const InstructorCourses = lazy(() => import('@/pages/instructor/InstructorCourses'));
const CourseEditor = lazy(() => import('@/pages/instructor/CourseEditor'));
const CoursePreview = lazy(() => import('@/pages/instructor/CoursePreview'));
const InstructorStudents = lazy(() => import('@/pages/instructor/InstructorStudents'));
const InstructorAnalytics = lazy(() => import('@/pages/instructor/InstructorAnalytics'));
const InstructorEarnings = lazy(() => import('@/pages/instructor/InstructorEarnings'));
const InstructorReviews = lazy(() => import('@/pages/instructor/InstructorReviews'));
const InstructorProfile = lazy(() => import('@/pages/instructor/InstructorProfile'));
const InstructorSettings = lazy(() => import('@/pages/instructor/InstructorSettings'));
const Learn = lazy(() => import('@/pages/student/Learn'));
const LearnRedirect = lazy(() => import('@/pages/student/LearnRedirect'));

const instructorRoutes: RouteObject[] = [
  { path: '/instructor', element: <InstructorDashboard /> },
  { path: '/instructor/courses', element: <InstructorCourses /> },
  { path: '/instructor/courses/create', element: <CourseEditor /> },
  { path: '/instructor/courses/:id/edit', element: <CourseEditor /> },
  { path: '/instructor/courses/:id/preview', element: <CoursePreview /> },
  { path: '/instructor/students', element: <InstructorStudents /> },
  { path: '/instructor/analytics', element: <InstructorAnalytics /> },
  { path: '/instructor/earnings', element: <InstructorEarnings /> },
  { path: '/instructor/reviews', element: <InstructorReviews /> },
  { path: '/instructor/profile', element: <InstructorProfile /> },
  { path: '/instructor/settings', element: <InstructorSettings /> },
];

const adminRoutes: RouteObject[] = [
  { path: '/admin', element: <AdminDashboard /> },
  { path: '/admin/students', element: <AdminStudents /> },
  { path: '/admin/instructors', element: <AdminInstructors /> },
  { path: '/admin/courses', element: <AdminCourses /> },
  { path: '/admin/enrollments', element: <AdminEnrollments /> },
  { path: '/admin/revenue', element: <AdminRevenue /> },
  { path: '/admin/analytics', element: <AdminAnalytics /> },
  { path: '/admin/reports', element: <AdminReports /> },
  { path: '/admin/settings', element: <AdminSettings /> },
];

const studentRoutes: RouteObject[] = [
  { path: '/courses', element: <Courses /> },
  { path: '/courses/:courseId', element: <CourseDetails /> },
  { path: '/my-learning', element: <MyLearning /> },
  { path: '/wishlist', element: <Wishlist /> },
  { path: '/profile', element: <Profile /> },
  { path: '/certificates', element: <Certificates /> },
  { path: '/notifications', element: <Notifications /> },
  { path: '/learn/:courseId', element: <LearnRedirect /> },
  { path: '/learn/:courseId/:lessonId', element: <Learn /> },
];

const suspended = (element: ReactElement): ReactElement => <Suspense fallback={<div className="p-6"><PageSkeleton /></div>}>{element}</Suspense>;

/** "/" is the public landing page for guests and the dashboard for students. */
function RootEntry() {
  const user = useAppSelector(selectCurrentUser);
  if (!user) return suspended(<Landing />);
  if (user.role === 'student') return <AppShell><StudentDashboard /></AppShell>;
  return <Navigate to={homeFor(user.role)} replace />;
}

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <RootEntry /> },
      {
        element: <GuestRoute />,
        children: [
          { path: '/login', element: suspended(<Login />) },
          { path: '/register', element: suspended(<Register />) },
          { path: '/forgot-password', element: suspended(<ForgotPassword />) },
        ],
      },
      {
        element: <RoleRoute allow={['student']} />,
        children: [{ element: <AppShell />, children: studentRoutes }],
      },
      {
        element: <RoleRoute allow={['instructor']} />,
        children: [{ element: <AppShell />, children: instructorRoutes }],
      },
      {
        element: <RoleRoute allow={['admin']} />,
        children: [{ element: <AppShell />, children: adminRoutes }],
      },
      { path: '*', element: suspended(<NotFound />) },
    ],
  },
]);
