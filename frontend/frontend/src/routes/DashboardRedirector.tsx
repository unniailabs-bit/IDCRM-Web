import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from './routeConfig';

interface RoleRedirectMap {
  [key: string]: string;
}

const roleRedirectMap: RoleRedirectMap = {
  'platform-admin': '/dashboard',
  'super-admin': '/super-dashboard',
  'school-admin': '/school-dashboard',
  teacher: '/teacher-dashboard',
};

export function DashboardRedirector() {
  const { isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // console.log(
    //   'DashboardRedirector: useEffect triggered. isAuthenticated:',
    //   isAuthenticated,
    //   'userRole:',
    //   userRole
    // );
    if (isAuthenticated && userRole) {
      const redirectPath = roleRedirectMap[userRole];
      // console.log(
      //   'DashboardRedirector: Authenticated. User role:',
      //   userRole,
      //   'Redirect path:',
      //   redirectPath
      // );
      if (redirectPath) {
        navigate(redirectPath, { replace: true });
      } else {
        console.warn(
          'DashboardRedirector: No redirect path found for role:',
          userRole,
          'Navigating to /unauthorized.'
        );
        navigate('/unauthorized', { replace: true });
      }
    } else if (!isAuthenticated) {
      // This case should ideally be handled by ProtectedRoute, but as a fallback
      // console.log('DashboardRedirector: Not authenticated. Navigating to /login.');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, userRole, navigate]);

  return null; // This component doesn't render anything
}
