import { LucideIcon } from 'lucide-react';
import {
  Building2,
  GraduationCap,
  CreditCard,
  Receipt,
  Settings,
  LayoutDashboard,
  Users,
  FormInput,
  CreditCard as PaymentIcon,
} from 'lucide-react';

export type UserRole = 'platform-admin' | 'super-admin' | 'school-admin' | 'teacher';

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

export const platformAdminMenuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'trusts', label: 'Trust Management', icon: Building2, path: '/trusts' },
  { id: 'schools', label: 'School Management', icon: GraduationCap, path: '/schools' },
  { id: 'credits', label: 'Credit Management', icon: CreditCard, path: '/credits' },
  { id: 'billing', label: 'Billing & Reports', icon: Receipt, path: '/billing' },
  { id: 'payments', label: 'Payment Gateway', icon: PaymentIcon, path: '/payments' },
  { id: 'settings', label: 'Platform Settings', icon: Settings, path: '/settings' },
];

export const superAdminMenuItems: MenuItem[] = [
  { id: 'super-dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/super-dashboard' },
  { id: 'super-schools', label: 'School Management', icon: GraduationCap, path: '/super-schools' },
  { id: 'super-billing', label: 'Billing & Invoices', icon: Receipt, path: '/super-billing' },
  {
    id: 'super-allocation',
    label: 'Credit Allocation',
    icon: CreditCard,
    path: '/super-allocation',
  },
  { id: 'super-credits', label: 'Credit Tracking', icon: CreditCard, path: '/super-credits' },
  { id: 'super-reports', label: 'Reports & Analytics', icon: Receipt, path: '/super-reports' },
];

export const schoolAdminMenuItems: MenuItem[] = [
  { id: 'school-dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/school-dashboard' },
  { id: 'classes', label: 'Class & Division', icon: Users, path: '/classes' },
  { id: 'students', label: 'Student Management', icon: GraduationCap, path: '/students' },
  { id: 'teachers', label: 'Teacher Management', icon: Users, path: '/teachers' },
  { id: 'digital-forms', label: 'Digital Forms', icon: FormInput, path: '/digital-forms' },
  { id: 'school-credits', label: 'Credits & Billing', icon: CreditCard, path: '/school-credits' },
];

export const teacherMenuItems: MenuItem[] = [
  {
    id: 'teacher-dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/teacher-dashboard',
  },
  { id: 'my-classes', label: 'My Classes', icon: Users, path: '/my-classes' },
  { id: 'student-forms', label: 'Student Forms', icon: FormInput, path: '/student-forms' },
  { id: 'approvals', label: 'Pending Approvals', icon: Receipt, path: '/approvals' },
  { id: 'import-students', label: 'Import Students', icon: Users, path: '/importstudents' },
];

export const getMenuItemsByRole = (role: UserRole): MenuItem[] => {
  switch (role) {
    case 'platform-admin':
      return platformAdminMenuItems;
    case 'super-admin':
      return superAdminMenuItems;
    case 'school-admin':
      return schoolAdminMenuItems;
    case 'teacher':
      return teacherMenuItems;
    default:
      return [];
  }
};
