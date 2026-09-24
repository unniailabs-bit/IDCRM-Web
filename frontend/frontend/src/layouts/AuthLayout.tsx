import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 px-4">{children}</div>
  );
}
