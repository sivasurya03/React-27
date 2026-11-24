import {
  Award, BarChart3, Bell, BookOpen, ClipboardList, DollarSign, GraduationCap, Heart, LayoutDashboard, Library, PlusCircle,
  Settings, ShieldCheck, Star, User, Users, Wallet, FileText, Layers, type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/types';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

export const NAV: Record<Role, NavItem[]> = {
  student: [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
    { label: 'Browse Courses', to: '/courses', icon: Library },
    { label: 'My Learning', to: '/my-learning', icon: BookOpen },
    { label: 'Wishlist', to: '/wishlist', icon: Heart },
    { label: 'Certificates', to: '/certificates', icon: Award },
    { label: 'Notifications', to: '/notifications', icon: Bell },
    { label: 'Profile', to: '/profile', icon: User },
  ],
  instructor: [
    { label: 'Dashboard', to: '/instructor', icon: LayoutDashboard, end: true },
    { label: 'My Courses', to: '/instructor/courses', icon: Library, end: true },
    { label: 'Create Course', to: '/instructor/courses/create', icon: PlusCircle },
    { label: 'Students', to: '/instructor/students', icon: Users },
    { label: 'Analytics', to: '/instructor/analytics', icon: BarChart3 },
    { label: 'Earnings', to: '/instructor/earnings', icon: Wallet },
    { label: 'Reviews', to: '/instructor/reviews', icon: Star },
    { label: 'Profile', to: '/instructor/profile', icon: User },
    { label: 'Settings', to: '/instructor/settings', icon: Settings },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Students', to: '/admin/students', icon: Users },
    { label: 'Instructors', to: '/admin/instructors', icon: ShieldCheck },
    { label: 'Courses', to: '/admin/courses', icon: Library },
    { label: 'Enrollments', to: '/admin/enrollments', icon: ClipboardList },
    { label: 'Revenue', to: '/admin/revenue', icon: DollarSign },
    { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
    { label: 'Reports', to: '/admin/reports', icon: FileText },
    { label: 'Settings', to: '/admin/settings', icon: Settings },
  ],
};

export const ROLE_LABEL: Record<Role, string> = { student: 'Student', instructor: 'Instructor', admin: 'Administrator' };
export const ROLE_ICON: Record<Role, LucideIcon> = { student: GraduationCap, instructor: Layers, admin: ShieldCheck };
