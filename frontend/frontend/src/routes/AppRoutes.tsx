import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  CheckSquare,
  FileUp,
  FileText,
  Bell,
  Banknote,
  CalendarDays,
  Calendar,
  MessageSquare,
} from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { UserRole } from './routeConfig';
import { DashboardRedirector } from './DashboardRedirector';

import { AdminDashboard } from '../components/roles/admin/AdminDashboard';
import { TrustManagement } from '../components/roles/admin/TrustManagement';
import { TrustDetail } from '../components/roles/admin/TrustDetail';
import { SchoolManagement as AdminSchoolManagement } from '../components/roles/admin/SchoolManagement';
import { CreateSchool } from '../components/roles/admin/CreateSchool';
import { EditSchool as AdminEditSchool } from '../components/roles/admin/EditSchool';
import { SchoolDetail as AdminSchoolDetail } from '../components/roles/admin/SchoolDetail';
import { AdminSchoolClassManagement } from '../components/roles/admin/AdminSchoolClassManagement';
import { AdminSchoolTeacherManagement } from '../components/roles/admin/AdminSchoolTeacherManagement';
import { CreateTrust } from '../components/roles/admin/CreateTrust';
import { CreditManagement } from '../components/roles/admin/CreditManagement';
import { CreditRequests } from '../components/roles/admin/CreditRequests';
import { BillingReports } from '../components/roles/admin/BillingReports';
import { PaymentGateway } from '../components/roles/admin/PaymentGateway';
import { PlatformSettings } from '../components/roles/admin/PlatformSettings';
import { ApprovalQueue } from '../components/roles/admin/ApprovalQueue';

import { TrustAdminDashboard } from '../components/roles/trust-admin/TrustAdminDashboard';
import { SchoolManagement as TrustSchoolManagement } from '../components/roles/trust-admin/SchoolManagement';
import { TrustBilling } from '../components/roles/trust-admin/TrustBilling';
import { CreditAllocation } from '../components/roles/trust-admin/CreditAllocation';
import { CreditTracking } from '../components/roles/trust-admin/CreditTracking';
import { ReportsAnalytics } from '../components/roles/trust-admin/ReportsAnalytics';

import { SchoolAdminDashboard } from '../components/roles/school-admin/SchoolAdminDashboard';
import { ClassManagement } from '../components/roles/school-admin/ClassManagement';
import { StudentManagement } from '../components/roles/school-admin/StudentManagement';
import { StudentDetail } from '../components/roles/school-admin/StudentDetail';
import { TeacherManagement } from '../components/roles/school-admin/TeacherManagement';
import { TeacherDetail } from '../components/roles/school-admin/TeacherDetail';
import { DigitalForms } from '../components/roles/school-admin/DigitalForms';
import { IDCardGallery } from '../components/roles/school-admin/IdCardTemplate';
import { IDCardPreview } from '../components/roles/school-admin/IdCardPreview';
import StudentDataSheet from '../components/roles/school-admin/StudentDataSheet';
import IDCardManagement from '../components/roles/school-admin/IDCardManagement';
import { SchoolSettings } from '../components/roles/school-admin/SchoolSettings';
import { SchoolReports } from '../components/roles/school-admin/SchoolReports';
import { SchoolCredits } from '../components/roles/school-admin/SchoolCredits';
import { Notifications } from '../components/roles/school-admin/Notifications';
import StudentDataView from '../components/roles/school-admin/StudentDataView';
import { FeesModule } from '../components/roles/school-admin/FeesModule';
import { HolidayCalendar } from '../components/roles/school-admin/HolidayCalendar';
import { AppointmentManagement } from '../components/roles/school-admin/AppointmentManagement';

import { TeacherDashboard } from '../components/roles/teacher/TeacherDashboard';
import { MyClasses } from '../components/roles/teacher/MyClasses';
import { StudentForms } from '../components/roles/teacher/StudentForms';
import { PendingApprovals } from '../components/roles/teacher/PendingApprovals';
import { ImportStudents } from '../components/roles/teacher/ImportStudent';
import { TeacherImageUploadGrid } from '../components/roles/teacher/TeacherImageUploadGrid';
import StudentList from '../components/roles/teacher/StudentList';
import { ClassStudentList } from '../components/roles/teacher/ClassStudentList';
import { EditorPage } from '../components/roles/school-admin/pages/EditorPage';

import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { LoginPage as Login } from '../pages/Login';
import { TrustRegistration } from '../components/roles/trust-admin/registration/TrustRegistration';
import { SchoolConfiguration } from '../components/roles/trust-admin/registration/TrustRegistration1';
import { ReviewConfirm } from '../components/roles/trust-admin/registration/TrustRegistration2';
import { TrustConfirmation } from '../components/roles/trust-admin/registration/TrustRegistration3';
import { PublicFormPage } from '../components/public/PublicFormPage';
import { VerifyStudent } from '../components/public/VerifyStudent';
import { CreateSchoolTrustAdmin } from '../components/roles/trust-admin/CreateSchool';
import { EditSchool } from '../components/roles/trust-admin/EditSchool';
import { TrustSchoolDetail } from '../components/roles/trust-admin/SchoolDetail';
import { TrustSchoolClassManagement } from '../components/roles/trust-admin/TrustSchoolClassManagement';
import { TrustSchoolTeacherManagement } from '../components/roles/trust-admin/TrustSchoolTeacherManagement';
import { TrustSchoolTeacherDetail } from '../components/roles/trust-admin/TrustSchoolTeacherDetail';
import { InquiryList } from '../components/roles/admin/InquiryList';

// Define MenuItem type
interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

// Helper function to get menu items based on role
const getMenuItems = (userRole: UserRole, t: any): MenuItem[] => {
  switch (userRole) {
    case 'platform-admin':
      return [
        { id: 'dashboard', label: t('menu.dashboard'), icon: LayoutDashboard, path: '/dashboard' },
        // { id: 'approvals', label: t('menu.approvals'), icon: CheckSquare, path: '/dashboard/approvals' },
        { id: 'trusts', label: t('menu.trusts'), icon: Building2, path: '/dashboard/trusts' },
        {
          id: 'schools',
          label: t('menu.schools'),
          icon: GraduationCap,
          path: '/dashboard/schools',
        },
        { id: 'credits', label: t('menu.credits'), icon: CreditCard, path: '/dashboard/credits' },
        {
          id: 'credit-requests',
          label: t('menu.credit-requests'),
          icon: FileText,
          path: '/dashboard/credit-requests',
        },
        // { id: 'billing', label: t('menu.billing'), icon: Receipt, path: '/dashboard/billing' },
        // {
        //   id: 'payments',
        //   label: t('menu.payments'),
        //   icon: PaymentIcon,
        //   path: '/dashboard/payments',
        // },
        {
          id: 'inquiries',
          label: t('menu.inquiries'),
          icon: MessageSquare,
          path: '/dashboard/inquiries',
        },
      ];
    case 'super-admin':
      return [
        {
          id: 'super-dashboard',
          label: t('menu.super-dashboard'),
          icon: LayoutDashboard,
          path: '/super-dashboard',
        },
        {
          id: 'super-schools',
          label: t('menu.super-schools'),
          icon: GraduationCap,
          path: '/super-dashboard/super-schools',
        },
        // {
        //   id: 'super-billing',
        //   label: t('menu.super-billing'),
        //   icon: Receipt,
        //   path: '/super-dashboard/super-billing',
        // },
        {
          id: 'super-allocation',
          label: t('menu.super-allocation'),
          icon: CreditCard,
          path: '/super-dashboard/super-allocation',
        },
        {
          id: 'super-credits',
          label: t('menu.super-credits'),
          icon: CreditCard,
          path: '/super-dashboard/super-credits',
        },
        // {
        //   id: 'super-reports',
        //   label: t('menu.super-reports'),
        //   icon: Receipt,
        //   path: '/super-dashboard/super-reports',
        // },
        // {
        //   id: 'trust-registration',
        //   label: t('menu.trust-registration'),
        //   icon: FormInput,
        //   path: '/super-dashboard/trust-registration',
        // },
      ];
    case 'school-admin':
      return [
        {
          id: 'school-dashboard',
          label: t('menu.school-dashboard'),
          icon: LayoutDashboard,
          path: '/school-dashboard',
        },
        {
          id: 'classes',
          label: t('menu.classes'),
          icon: Users,
          path: '/school-dashboard/classes',
        },
        {
          id: 'calendar',
          label: t('menu.calendar'),
          icon: CalendarDays,
          path: '/school-dashboard/calendar',
        },
        {
          id: 'students',
          label: t('menu.students'),
          icon: GraduationCap,
          path: '/school-dashboard/students',
        },
        {
          id: 'teachers',
          label: t('menu.teachers'),
          icon: Users,
          path: '/school-dashboard/teachers',
        },
        {
          id: 'digital-forms',
          label: t('menu.digital-forms'),
          icon: FormInput,
          path: '/school-dashboard/digital-forms',
        },
        {
          id: 'fees',
          label: t('menu.fees'),
          icon: Banknote,
          path: '/school-dashboard/fees',
        },
        {
          id: 'appointments',
          label: t('menu.appointments'),
          icon: Calendar,
          path: '/school-dashboard/appointments',
        },
        // {
        //   id: 'school-credits',
        //   label: t('menu.school-credits'),
        //   icon: CreditCard,
        //   path: '/school-dashboard/school-credits',
        // },
        // {
        //   id: 'school-reports',
        //   label: t('menu.school-reports'),
        //   icon: FileText,
        //   path: '/school-dashboard/reports',
        // },
        {
          id: 'school-notifications',
          label: t('menu.school-notifications'),
          icon: Bell,
          path: '/school-dashboard/notifications',
        },
        {
          id: 'school-settings',
          label: t('menu.settings'),
          icon: Settings,
          path: '/school-dashboard/settings',
        },
      ];
    case 'teacher':
      return [
        {
          id: 'teacher-dashboard',
          label: t('menu.teacher-dashboard'),
          icon: LayoutDashboard,
          path: '/teacher-dashboard',
        },
        {
          id: 'my-classes',
          label: t('menu.my-classes'),
          icon: Users,
          path: '/teacher-dashboard/my-classes',
        },
        {
          id: 'student-forms',
          label: t('menu.student-forms'),
          icon: FormInput,
          path: '/teacher-dashboard/student-forms',
        },
        {
          id: 'approvals',
          label: t('menu.approvals'),
          icon: Receipt,
          path: '/teacher-dashboard/approvals',
        },
        {
          id: 'import-students',
          label: t('menu.import-students'),
          icon: FileUp,
          path: '/teacher-dashboard/importstudents',
        },
      ];
    default:
      return [];
  }
};

// ProtectedRoute component
const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}) => {
  const { isAuthenticated, userRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export function AppRoutes() {
  const { userRole, login } = useAuth();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registered:', registration);
          })
          .catch((error) => {
            console.log('SW registration failed:', error);
          });
      });
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismissInstallPrompt = () => {
    setShowInstallPrompt(false);
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <AuthLayout>
            <Login />
          </AuthLayout>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute
            allowedRoles={['platform-admin', 'super-admin', 'school-admin', 'teacher']}
          >
            <DashboardRedirector />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute allowedRoles={['platform-admin']}>
            <DashboardLayout
              menuItems={getMenuItems('platform-admin', t)}
              userRole={'platform-admin'}
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
              showInstallPrompt={showInstallPrompt}
              handleInstallClick={handleInstallClick}
              handleDismissInstallPrompt={handleDismissInstallPrompt}
            >
              <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/approvals" element={<ApprovalQueue />} />
                <Route path="/trusts" element={<TrustManagement />} />
                <Route path="/trusts/:id" element={<TrustDetail />} />
                <Route path="/trusts/create-trust" element={<CreateTrust />} />
                <Route path="/trusts/create-trust/:id" element={<CreateTrust />} />
                <Route path="/schools" element={<AdminSchoolManagement />} />
                <Route path="/schools/create-school" element={<CreateSchool />} />
                <Route path="/schools/:id" element={<AdminSchoolDetail />} />
                <Route path="/schools/edit-school/:id" element={<AdminEditSchool />} />
                <Route path="/schools/:schoolId/classes" element={<AdminSchoolClassManagement />} />
                <Route
                  path="/schools/:schoolId/teachers"
                  element={<AdminSchoolTeacherManagement />}
                />
                <Route path="/credits" element={<CreditManagement />} />
                <Route path="/credit-requests" element={<CreditRequests />} />
                <Route path="/billing" element={<BillingReports />} />
                <Route path="/payments" element={<PaymentGateway />} />
                <Route path="/settings" element={<PlatformSettings />} />
                <Route path="/inquiries" element={<InquiryList />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/super-dashboard/*"
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <DashboardLayout
              menuItems={getMenuItems('super-admin', t)}
              userRole={'super-admin'}
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
              showInstallPrompt={showInstallPrompt}
              handleInstallClick={handleInstallClick}
              handleDismissInstallPrompt={handleDismissInstallPrompt}
            >
              <Routes>
                <Route path="/" element={<TrustAdminDashboard />} />
                <Route path="/super-schools" element={<TrustSchoolManagement />} />
                <Route path="/schools/:id" element={<TrustSchoolDetail />} />
                <Route path="/super-billing" element={<TrustBilling />} />
                <Route path="/super-allocation" element={<CreditAllocation />} />
                <Route path="/super-credits" element={<CreditTracking />} />
                <Route path="/super-reports" element={<ReportsAnalytics />} />
                <Route path="/add-school" element={<CreateSchoolTrustAdmin />} />
                <Route path="/edit-school/:id" element={<EditSchool />} />
                <Route path="/schools/:schoolId/classes" element={<TrustSchoolClassManagement />} />
                <Route
                  path="/schools/:schoolId/teachers"
                  element={<TrustSchoolTeacherManagement />}
                />
                <Route
                  path="/schools/:schoolId/teachers/:teacherId"
                  element={<TrustSchoolTeacherDetail />}
                />
                <Route path="/trust-registration" element={<TrustRegistration />} />
                <Route path="/trust-registration/step1" element={<SchoolConfiguration />} />
                <Route path="/trust-registration/review" element={<ReviewConfirm />} />
                <Route path="/trust-registration/confirm" element={<TrustConfirmation />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/school-dashboard/*"
        element={
          <ProtectedRoute allowedRoles={['school-admin']}>
            <DashboardLayout
              menuItems={getMenuItems('school-admin', t)}
              userRole={'school-admin'}
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
              showInstallPrompt={showInstallPrompt}
              handleInstallClick={handleInstallClick}
              handleDismissInstallPrompt={handleDismissInstallPrompt}
            >
              <Routes>
                <Route path="/" element={<SchoolAdminDashboard />} />
                <Route path="/classes" element={<ClassManagement />} />
                <Route path="/students" element={<StudentManagement />} />
                <Route path="/students/:studentId" element={<StudentDetail />} />
                <Route path="/teachers" element={<TeacherManagement />} />
                <Route path="/teachers/:teacherId" element={<TeacherDetail />} />
                <Route path="/digital-forms" element={<DigitalForms />} />
                <Route path="/calendar" element={<HolidayCalendar />} />
                <Route path="/fees" element={<FeesModule />} />
                <Route path="/appointments" element={<AppointmentManagement />} />
                {/* <Route path="/school-credits" element={<SchoolCredits />} />
                <Route path="/reports" element={<SchoolReports />} /> */}
                <Route path="/settings" element={<SchoolSettings />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/id-template" element={<IDCardGallery />} />
                <Route path="/id-preview" element={<IDCardPreview />} />
                <Route path="/id-editor" element={<EditorPage />} />
                <Route path="/student-data-sheet" element={<StudentDataSheet />} />
                <Route path="id-card-management" element={<IDCardManagement />} />
                <Route path="/student-data-sheet/view" element={<StudentDataView />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher-dashboard/*"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <DashboardLayout
              menuItems={getMenuItems('teacher', t)}
              userRole={'teacher'}
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
              showInstallPrompt={showInstallPrompt}
              handleInstallClick={handleInstallClick}
              handleDismissInstallPrompt={handleDismissInstallPrompt}
            >
              <Routes>
                <Route path="/" element={<TeacherDashboard />} />
                <Route path="/my-classes" element={<MyClasses />} />
                <Route path="/class-students" element={<ClassStudentList />} />
                <Route path="/student-forms" element={<StudentForms />} />
                <Route path="/approvals" element={<PendingApprovals />} />
                <Route path="/importstudents" element={<ImportStudents />} />
                <Route path="/upload-images" element={<TeacherImageUploadGrid />} />
                <Route path="/student-list" element={<StudentList />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Public Routes - No Authentication Required */}
      <Route path="/public-form/:token" element={<PublicFormPage />} />
      <Route path="/verify/:token" element={<VerifyStudent />} />

      <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
