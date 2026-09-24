import React from 'react';
import { useAuth } from '../hooks/useAuth';

export function AuthTestComponent() {
  console.log('AuthTestComponent: Component rendered.');
  try {
    const { isAuthenticated, userRole, login, logout } = useAuth();
    console.log('AuthTestComponent: useAuth successful!');
    console.log('AuthTestComponent: isAuthenticated:', isAuthenticated);
    console.log('AuthTestComponent: userRole:', userRole);
    return (
      <div>
        <h1>Auth Test Component</h1>
        <p>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
        <p>User Role: {userRole || 'N/A'}</p>
        <button onClick={() => login('platform-admin')}>Login as Admin</button>
        <button onClick={logout}>Logout</button>
      </div>
    );
  } catch (error: any) {
    console.error('AuthTestComponent: Error calling useAuth:', error.message);
    return (
      <div>
        <h1>Auth Test Component - Error</h1>
        <p>Error: {error.message}</p>
        <p>Check console for details.</p>
      </div>
    );
  }
}
