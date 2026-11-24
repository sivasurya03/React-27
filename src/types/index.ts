export type Role = 'student' | 'instructor' | 'admin';
export type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: Role;
  phone?: string;
  bio?: string;
  location?: string;
  preferences?: UserPreferences;
  expertise?: string[];
  website?: string;
  social?: { twitter?: string; linkedin?: string; github?: string };
  instructorSettings?: InstructorSettings;
  createdAt: string;
}

export interface InstructorSettings {
  notifications: { enrollment: boolean; assignment: boolean; review: boolean; payment: boolean; platform: boolean };
  profileVisible: boolean;
  defaultVisibility: 'draft' | 'published';
  emailPreferences: 'all' | 'important' | 'none';
}

export interface UserPreferences {
  emailNotifications: boolean;
  courseUpdates: boolean;
  weeklyDigest: boolean;
}

export interface AuthSession {
  user: User;
  token: string;
}

export const COURSE_CATEGORIES = [
  'Web Development',
  'UI/UX Design',
  'Data Science',
  'Artificial Intelligence',
  'Digital Marketing',
  'Business',
  'Photography',
  'Finance',
  'Mobile Development',
  'Cloud Computing',
] as const;
export type CourseCategory = (typeof COURSE_CATEGORIES)[number];
export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
export type CourseStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'archived';

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: CourseCategory;
  level: CourseLevel;
  language: string;
  price: number;
  /** Discount percentage, 0-100 */
  discount: number;
  rating: number;
  studentsCount: number;
  /** Total hours, derived from the curriculum */
  duration: number;
  lessonsCount: number;
  instructorId: string;
  status: CourseStatus;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  subtitle?: string;
  outcomes?: string[];
  requirements?: string[];
  subscription?: boolean;
  rejectionReason?: string;
  featured?: boolean;
}

export type AccountStatus = 'active' | 'suspended' | 'deactivated';
export type InstructorStatus = 'pending' | 'active' | 'suspended';

export interface Instructor {
  status?: InstructorStatus;
  joinedAt?: string;
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio: string;
  rating: number;
  studentsCount: number;
  coursesCount: number;
  revenue: number;
}

export interface Student {
  status?: AccountStatus;
  joinedAt?: string;
  id: string;
  name: string;
  email: string;
  avatar?: string;
  coursesEnrolled: number;
  coursesCompleted: number;
  learningHours: number;
  streak: number;
}

export type EnrollmentStatus = 'not-started' | 'in-progress' | 'completed';

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  /** 0-100 */
  progress: number;
  status: EnrollmentStatus;
  enrolledAt: string;
  lastAccessedAt: string;
  /** Set by an admin: the student loses access to the course. */
  adminStatus?: 'cancelled' | 'refunded';
}

export type LessonType = 'video' | 'article' | 'quiz' | 'assignment' | 'resource';

export interface Lesson {
  id: string;
  courseId: string;
  chapterId: string;
  title: string;
  type: LessonType;
  /** Minutes */
  duration: number;
  isCompleted: boolean;
  isPreview: boolean;
}

export interface Chapter {
  id: string;
  courseId: string;
  title: string;
  lessons: Lesson[];
}

export interface Review {
  id: string;
  courseId: string;
  studentId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type NotificationType =
  | 'course-update'
  | 'assignment'
  | 'quiz'
  | 'recommendation'
  | 'certificate'
  | 'announcement'
  | 'system';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  /** Who the notification is for; defaults to student. */
  audience?: Role;
}

export interface AdminStats {
  totals: {
    students: number;
    instructors: number;
    courses: number;
    activeCourses: number;
    enrollments: number;
    completed: number;
    revenue: number;
    monthlyRevenue: number;
    refunds: number;
  };
  /** Percentage change versus the previous month. */
  changes: { students: number; instructors: number; courses: number; activeCourses: number; enrollments: number; completed: number; revenue: number; monthlyRevenue: number };
  revenueSeries: { month: string; revenue: number; net: number }[];
  enrollmentSeries: { month: string; enrollments: number }[];
  studentSeries: { month: string; students: number }[];
}

export interface AdminAnalytics {
  period: AnalyticsPeriod;
  points: SeriesPoint[];
  category: { category: string; courses: number; enrollments: number; revenue: number }[];
  courses: CoursePerformance[];
  instructors: { id: string; name: string; courses: number; students: number; revenue: number; rating: number }[];
}

export interface AdminSettings {
  platformName: string;
  supportEmail: string;
  timezone: string;
  currency: string;
  notifications: { newStudent: boolean; newInstructor: boolean; courseSubmitted: boolean; enrollment: boolean; revenue: boolean; system: boolean };
  allowRegistrations: boolean;
  instructorApprovals: boolean;
  courseApprovals: boolean;
  maintenanceMode: boolean;
  sessionTimeout: '30' | '60' | '240' | 'never';
  strongPasswords: boolean;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}

export type ResourceType = 'pdf' | 'notes' | 'slides' | 'document' | 'zip' | 'reference';

export interface LearningResource {
  id: string;
  title: string;
  type: ResourceType;
  sizeKb: number;
}

export interface CertificateRecord {
  id: string;
  courseId: string;
  studentId: string;
  studentName: string;
  courseTitle: string;
  instructorName: string;
  completedAt: string;
  durationHours: number;
}

export interface LessonContent {
  quiz?: QuizQuestion[];
  assignment?: { instructions: string[]; maxScore: number; dueDays: number; requireSubmission?: boolean };
  resources?: LearningResource[];
}

export type AnalyticsPeriod = 'd7' | 'd30' | 'd90' | 'y1';

export interface SeriesPoint {
  label: string;
  enrollments: number;
  revenue: number;
  students: number;
  rating: number;
}

export interface CoursePerformance {
  courseId: string;
  title: string;
  enrollments: number;
  completionRate: number;
  rating: number;
  revenue: number;
  avgQuizScore: number;
  activeStudents: number;
}

export interface InstructorAnalytics {
  period: AnalyticsPeriod;
  courseId: string;
  points: SeriesPoint[];
  totals: { enrollments: number; revenue: number; activeStudents: number; completionRate: number; avgQuizScore: number; avgRating: number };
  performance: CoursePerformance[];
  engagement: { label: string; value: number }[];
}

export interface InstructorDashboardData {
  kpis: {
    totalCourses: number;
    published: number;
    drafts: number;
    archived: number;
    students: number;
    enrollments: number;
    rating: number;
    revenue: number;
    completionRate: number;
  };
  enrollmentTrend: { label: string; enrollments: number }[];
  revenueTrend: { label: string; revenue: number }[];
  performance: CoursePerformance[];
}

export type TransactionStatus = 'completed' | 'pending' | 'refunded';

export interface EarningsTransaction {
  id: string;
  date: string;
  student: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  fee: number;
  net: number;
  status: TransactionStatus;
}

export interface EarningsData {
  summary: { total: number; thisMonth: number; lastMonth: number; pending: number; withdrawable: number };
  monthly: { month: string; revenue: number }[];
  transactions: EarningsTransaction[];
}
