import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from './routeConfig';

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, userRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (userRole && !allowedRoles.includes(userRole)) {
    // Redirect to a 403 or unauthorized page, or a default dashboard for their role
    return <Navigate to="/unauthorized" replace />; // You might want to create an UnauthorizedPage
  }

  return children;
}
