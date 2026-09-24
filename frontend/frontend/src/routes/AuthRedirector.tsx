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

export function AuthRedirector() {
  const { isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();

  // console.log(
  //   'AuthRedirector: Component rendered. isAuthenticated:',
  //   isAuthenticated,
  //   'userRole:',
  //   userRole
  // );

  useEffect(() => {
    // console.log(
    //   'AuthRedirector: useEffect triggered. isAuthenticated:',
    //   isAuthenticated,
    //   'userRole:',
    //   userRole
    // );
    if (isAuthenticated && userRole) {
      const redirectPath = roleRedirectMap[userRole];
      // console.log(
      //   'AuthRedirector: Authenticated. User role:',
      //   userRole,
      //   'Redirect path:',
      //   redirectPath
      // );
      if (redirectPath) {
        navigate(redirectPath, { replace: true });
        // console.log('AuthRedirector: Navigating to:', redirectPath);
      } else {
        console.warn(
          'AuthRedirector: No redirect path found for role:',
          userRole,
          'Navigating to /unauthorized.'
        );
        navigate('/unauthorized', { replace: true });
      }
    } else if (!isAuthenticated) {
      // console.log('AuthRedirector: Not authenticated. Navigating to /login.');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, userRole, navigate]);

  return null; // This component doesn't render anything
}
