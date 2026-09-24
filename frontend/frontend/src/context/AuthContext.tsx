import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { UserRole } from '../routes/routeConfig';

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: UserRole | null;
  userData: any | null; // Add userData to store user-specific information
  login: (role: UserRole, userData: any) => void; // Modify login to accept userData
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    return storedAuth ? JSON.parse(storedAuth) : false;
  });
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    const storedRole = localStorage.getItem('userRole');
    return storedRole ? (storedRole as UserRole) : null;
  });
  const [userData, setUserData] = useState<any | null>(() => {
    // Add userData state
    const storedUserData = localStorage.getItem('userData');
    return storedUserData ? JSON.parse(storedUserData) : null;
  });

  useEffect(() => {
    // console.log('AuthContext: Persisting isAuthenticated to localStorage:', isAuthenticated);
    localStorage.setItem('isAuthenticated', JSON.stringify(isAuthenticated));
    if (userRole) {
      // console.log('AuthContext: Persisting userRole to localStorage:', userRole);
      localStorage.setItem('userRole', userRole);
    } else {
      // console.log('AuthContext: Removing userRole from localStorage.');
      localStorage.removeItem('userRole');
    }
    if (userData) {
      // Persist userData
      // console.log('AuthContext: Persisting userData to localStorage:', userData);
      localStorage.setItem('userData', JSON.stringify(userData));
    } else {
      // console.log('AuthContext: Removing userData from localStorage.');
      localStorage.removeItem('userData');
    }
  }, [isAuthenticated, userRole, userData]);

  const login = (role: UserRole, userData: any) => {
    // Modify login to accept userData
    // console.log('AuthContext: login function called with role:', role, 'and userData:', userData);
    setUserRole(role);
    setUserData(userData); // Set userData
    setIsAuthenticated(true);
    // console.log(
    //   'AuthContext: isAuthenticated set to true, userRole set to',
    //   role,
    //   'userData set to',
    //   userData
    // );
  };

  const logout = () => {
    setUserRole(null);
    setUserData(null); // Clear userData on logout
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData'); // Clear userData from localStorage
    localStorage.removeItem('token'); // Clear token from localStorage
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, userData, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
