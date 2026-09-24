import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { UserRole } from '../routes/routeConfig';

interface RoleRedirectMap {
  [key: string]: string;
}

const roleRedirectMap: RoleRedirectMap = {
  'platform-admin': '/dashboard',
  'super-admin': '/super-dashboard',
  'school-admin': '/school-dashboard',
  teacher: '/teacher-dashboard',
};

export function useRoleRedirect() {
  const { isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && userRole) {
      const redirectPath = roleRedirectMap[userRole];
      if (redirectPath) {
        navigate(redirectPath, { replace: true });
      } else {
        // Fallback for unknown roles or if no specific redirect is defined
        navigate('/unauthorized', { replace: true });
      }
    }
  }, [isAuthenticated, userRole, navigate]);
}
