import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from './routeConfig';

interface RoleBasedRouteProps {
  children: JSX.Element;
  role: UserRole;
}

export function RoleBasedRoute({ children, role }: RoleBasedRouteProps) {
  const { userRole } = useAuth();

  if (userRole === role) {
    return children;
  }

  // Optionally redirect to a generic dashboard or unauthorized page if role doesn't match
  return <Navigate to="/dashboard" replace />; // Or /unauthorized
}
